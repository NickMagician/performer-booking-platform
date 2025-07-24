import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';
import { sendMessageSchema, threadListSchema } from '../lib/validation';

// Create or get thread for an enquiry
export const createOrGetThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { enquiryId } = req.params;
    const userId = req.user!.id;

    // Check if enquiry exists and user is participant
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
      include: {
        client: { select: { id: true, first_name: true, last_name: true } },
        performer: { 
          include: { 
            user: { select: { id: true, first_name: true, last_name: true } } 
          } 
        },
        message_thread: {
          include: {
            messages: {
              orderBy: { sent_at: 'asc' },
              include: {
                sender: { select: { id: true, first_name: true, last_name: true } }
              }
            }
          }
        }
      }
    });

    if (!enquiry) {
      throw new AppError('Enquiry not found', 404);
    }

    // Check if user is participant (client or performer)
    const isClient = enquiry.client_id === userId;
    const isPerformer = enquiry.performer.user_id === userId;
    
    if (!isClient && !isPerformer) {
      throw new AppError('Not authorized to access this thread', 403);
    }

    // If thread exists, return it
    if (enquiry.message_thread) {
      return res.json({
        success: true,
        data: {
          thread: {
            id: enquiry.message_thread.id,
            enquiryId: enquiry.id,
            participants: [
              enquiry.client,
              { 
                id: enquiry.performer.user.id, 
                first_name: enquiry.performer.user.first_name, 
                last_name: enquiry.performer.user.last_name 
              }
            ],
            isArchived: enquiry.message_thread.is_archived,
            messages: enquiry.message_thread.messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              fileUrl: msg.file_url,
              isRead: msg.is_read,
              sentAt: msg.sent_at,
              sender: msg.sender
            })),
            createdAt: enquiry.message_thread.created_at
          }
        }
      });
    }

    // Create new thread
    const participantIds = [enquiry.client_id, enquiry.performer.user_id];
    
    const thread = await prisma.messageThread.create({
      data: {
        enquiry_id: enquiryId,
        participant_ids: participantIds,
      },
      include: {
        messages: {
          orderBy: { sent_at: 'asc' },
          include: {
            sender: { select: { id: true, first_name: true, last_name: true } }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Thread created successfully',
      data: {
        thread: {
          id: thread.id,
          enquiryId: thread.enquiry_id,
          participants: [
            enquiry.client,
            { 
              id: enquiry.performer.user.id, 
              first_name: enquiry.performer.user.first_name, 
              last_name: enquiry.performer.user.last_name 
            }
          ],
          isArchived: thread.is_archived,
          messages: [],
          createdAt: thread.created_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all threads for authenticated user
export const getUserThreads = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validatedQuery = threadListSchema.parse(req.query);
    const userId = req.user!.id;
    
    const { page = 1, limit = 10, isArchived } = validatedQuery;
    const skip = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      participant_ids: {
        has: userId
      }
    };

    if (isArchived !== undefined) {
      whereClause.is_archived = isArchived;
    }

    const [threads, total] = await Promise.all([
      prisma.messageThread.findMany({
        where: whereClause,
        include: {
          enquiry: {
            include: {
              client: { select: { id: true, first_name: true, last_name: true } },
              performer: { 
                include: { 
                  user: { select: { id: true, first_name: true, last_name: true } } 
                } 
              }
            }
          },
          messages: {
            orderBy: { sent_at: 'desc' },
            take: 1, // Get latest message for preview
            include: {
              sender: { select: { id: true, first_name: true, last_name: true } }
            }
          }
        },
        orderBy: { updated_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.messageThread.count({ where: whereClause })
    ]);

    const formattedThreads = threads.map(thread => ({
      id: thread.id,
      enquiryId: thread.enquiry_id,
      bookingId: thread.booking_id,
      participants: [
        thread.enquiry.client,
        { 
          id: thread.enquiry.performer.user.id, 
          first_name: thread.enquiry.performer.user.first_name, 
          last_name: thread.enquiry.performer.user.last_name 
        }
      ],
      isArchived: thread.is_archived,
      latestMessage: thread.messages[0] ? {
        id: thread.messages[0].id,
        content: thread.messages[0].content,
        sentAt: thread.messages[0].sent_at,
        sender: thread.messages[0].sender
      } : null,
      createdAt: thread.created_at,
      updatedAt: thread.updated_at
    }));

    res.json({
      success: true,
      data: {
        threads: formattedThreads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get specific thread with all messages
export const getThread = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: threadId } = req.params;
    const userId = req.user!.id;

    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        enquiry: {
          include: {
            client: { select: { id: true, first_name: true, last_name: true } },
            performer: { 
              include: { 
                user: { select: { id: true, first_name: true, last_name: true } } 
              } 
            }
          }
        },
        messages: {
          orderBy: { sent_at: 'asc' },
          include: {
            sender: { select: { id: true, first_name: true, last_name: true } }
          }
        }
      }
    });

    if (!thread) {
      throw new AppError('Thread not found', 404);
    }

    // Check if user is participant
    if (!thread.participant_ids.includes(userId)) {
      throw new AppError('Not authorized to access this thread', 403);
    }

    res.json({
      success: true,
      data: {
        thread: {
          id: thread.id,
          enquiryId: thread.enquiry_id,
          bookingId: thread.booking_id,
          participants: [
            thread.enquiry.client,
            { 
              id: thread.enquiry.performer.user.id, 
              first_name: thread.enquiry.performer.user.first_name, 
              last_name: thread.enquiry.performer.user.last_name 
            }
          ],
          isArchived: thread.is_archived,
          messages: thread.messages.map(msg => ({
            id: msg.id,
            content: msg.content,
            fileUrl: msg.file_url,
            isRead: msg.is_read,
            sentAt: msg.sent_at,
            sender: msg.sender
          })),
          createdAt: thread.created_at,
          updatedAt: thread.updated_at
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Send message to thread
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: threadId } = req.params;
    const validatedData = sendMessageSchema.parse(req.body);
    const userId = req.user!.id;

    // Check if thread exists and user is participant
    const thread = await prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        enquiry: {
          include: {
            client: { select: { id: true, first_name: true, last_name: true } },
            performer: { 
              include: { 
                user: { select: { id: true, first_name: true, last_name: true } } 
              } 
            }
          }
        }
      }
    });

    if (!thread) {
      throw new AppError('Thread not found', 404);
    }

    // Check if user is participant
    if (!thread.participant_ids.includes(userId)) {
      throw new AppError('Not authorized to send messages to this thread', 403);
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        thread_id: threadId,
        sender_id: userId,
        content: validatedData.content,
        file_url: validatedData.fileUrl,
      },
      include: {
        sender: { select: { id: true, first_name: true, last_name: true } }
      }
    });

    // Update thread's updated_at timestamp
    await prisma.messageThread.update({
      where: { id: threadId },
      data: { updated_at: new Date() }
    });

    // Mock notification to other participant(s)
    const otherParticipants = thread.participant_ids.filter(id => id !== userId);
    const senderName = `${message.sender.first_name} ${message.sender.last_name}`;
    
    otherParticipants.forEach(participantId => {
      const participant = participantId === thread.enquiry.client_id 
        ? thread.enquiry.client 
        : thread.enquiry.performer.user;
      
      console.log(`📧 Mock notification: New message from ${senderName} to ${participant.first_name} ${participant.last_name}: "${validatedData.content.substring(0, 50)}${validatedData.content.length > 50 ? '...' : ''}"`);
    });

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message: {
          id: message.id,
          content: message.content,
          fileUrl: message.file_url,
          isRead: message.is_read,
          sentAt: message.sent_at,
          sender: message.sender
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mark message as read
export const markMessageAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: messageId } = req.params;
    const userId = req.user!.id;

    // Check if message exists and user is participant of the thread
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        thread: true,
        sender: { select: { id: true, first_name: true, last_name: true } }
      }
    });

    if (!message) {
      throw new AppError('Message not found', 404);
    }

    // Check if user is participant of the thread
    if (!message.thread.participant_ids.includes(userId)) {
      throw new AppError('Not authorized to mark this message as read', 403);
    }

    // Can't mark own messages as read
    if (message.sender_id === userId) {
      throw new AppError('Cannot mark your own message as read', 400);
    }

    // Update message as read
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { is_read: true },
      include: {
        sender: { select: { id: true, first_name: true, last_name: true } }
      }
    });

    res.json({
      success: true,
      message: 'Message marked as read',
      data: {
        message: {
          id: updatedMessage.id,
          content: updatedMessage.content,
          fileUrl: updatedMessage.file_url,
          isRead: updatedMessage.is_read,
          sentAt: updatedMessage.sent_at,
          sender: updatedMessage.sender
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
