import { EventEmitter } from 'node:events';
import Mail from 'nodemailer/lib/mailer';
import { sendEmail } from '../email/send.email';
import { emailTemplate } from '../email/verfiy.template.email';
import { OtpEnum } from 'src/common/enums';

export const emailEvent = new EventEmitter();

interface IEmail extends Mail.Options {
  otp: string;
}

emailEvent.on(OtpEnum.confirmEmail, async (data: IEmail) => {
  try {
    data.subject = OtpEnum.confirmEmail;
    data.html = emailTemplate({ otp: data.otp, title: data.subject });
    await sendEmail(data);
  } catch (error) {
    console.log('fail to send email', error);
  }
});

emailEvent.on(OtpEnum.resetPassword, async (data: IEmail) => {
  try {
    data.subject = OtpEnum.resetPassword;
    data.html = emailTemplate({ otp: data.otp, title: data.subject });
    await sendEmail(data);
  } catch (error) {
    console.log('fail to send the code.', error);
  }
});
