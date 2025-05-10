import { EmailService } from '../services/emailService';
import nodemailer from 'nodemailer';

describe('EmailService (unit, mocked)', () => {
  const recipient = 'test@skillchecker.tech';
  const subject = 'SkillChecker EmailService Test';
  const text = 'This is a test email.';

  let emailService: EmailService;
  let sendMailMock: jest.Mock;

  beforeAll(() => {
    // Устанавливаем фейковые SMTP переменные окружения
    process.env.SMTP_HOST = 'smtp.test';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_SECURE = 'false';
    process.env.SMTP_USER = 'user';
    process.env.SMTP_PASSWORD = 'pass';
    process.env.SMTP_FROM = 'from@test';
    // Мокаем nodemailer.createTransport и sendMail
    sendMailMock = jest.fn().mockResolvedValue({ messageId: 'mocked-id' });
    jest.spyOn(nodemailer, 'createTransport').mockReturnValue({
      sendMail: sendMailMock,
    } as any);
    emailService = new EmailService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call sendMail with correct params', async () => {
    await emailService.sendMail({ to: recipient, subject, text });
    expect(sendMailMock).toHaveBeenCalledWith({
      from: expect.any(String),
      to: recipient,
      subject,
      text,
      html: undefined,
    });
  });

  it('should throw on invalid email', async () => {
    await expect(emailService.sendMail({ to: 'invalid', subject, text }))
      .rejects.toThrow('Invalid recipient email');
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('should throw on missing subject', async () => {
    await expect(emailService.sendMail({ to: recipient, subject: '', text }))
      .rejects.toThrow('Missing subject or body');
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('should throw on missing body', async () => {
    await expect(emailService.sendMail({ to: recipient, subject, text: '', html: undefined }))
      .rejects.toThrow('Missing subject or body');
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('should throw if sendMail fails', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('SMTP error'));
    await expect(emailService.sendMail({ to: recipient, subject, text }))
      .rejects.toThrow('SMTP error');
  });
});
