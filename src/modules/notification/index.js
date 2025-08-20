// src/modules/notification/index.js
import NotificationRepository from './repository.js';
import NotificationService from './service.js';

export const notificationRepository = new NotificationRepository();
export const notificationService = new NotificationService(notificationRepository);

export default notificationService; // 편의상 기본 export도
