export const emailTemplate = ({
  otp,
  title,
}: {
  otp: string;
  title: string;
}): string => {
  return `<!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
      <style type="text/css">
          body {
              background-color: #f4f4f4;
              margin: 0;
              font-family: Arial, sans-serif;
          }
          .container {
              max-width: 600px;
              margin: auto;
              padding: 30px;
              background-color: #ffffff;
              border: 1px solid #ddd;
              border-radius: 10px;
          }
          .header {
              background-color: #630E2B;
              color: #fff;
              text-align: center;
              padding: 20px 0;
              border-radius: 10px 10px 0 0;
          }
          .header img {
              width: 60px;
              height: 60px;
          }
          .title {
              color: #630E2B;
              font-size: 24px;
              margin: 30px 0 10px;
              text-align: center;
          }
          .message {
              font-size: 16px;
              color: #444;
              text-align: center;
              margin: 0 40px 20px;
          }
          .otp-box {
              background-color: #630E2B;
              color: #fff;
              padding: 15px 30px;
              margin: 20px auto;
              width: fit-content;
              font-size: 28px;
              letter-spacing: 5px;
              border-radius: 10px;
              font-weight: bold;
              font-family: 'Courier New', monospace;
          }
          .footer {
              text-align: center;
              margin-top: 40px;
              color: #888;
              font-size: 14px;
          }
          .social-links img {
              width: 40px;
              margin: 0 10px;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703716/Screenshot_1100_yne3vo.png" alt="Logo">
              <h2>${title}</h2>
          </div>
          <div class="content">
              <h3 class="title">${title}</h3>
              <p class="message">
                  Use the code below to confirm your email address.<br>
                  This code is valid for a limited time.
              </p>
              <div class="otp-box">${otp || "No code provided"}</div>
          </div>
          <div class="footer">
              <p>Stay connected</p>
              <div class="social-links">
                  <a href="${
                    process.env.facebookLink || "#"
                  }"><img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" alt="Facebook"></a>
                  <a href="${
                    process.env.instegram || "#"
                  }"><img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" alt="Instagram"></a>
                  <a href="${
                    process.env.twitterLink || "#"
                  }"><img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" alt="Twitter"></a>
              </div>
              <p style="margin-top: 20px;">Thank you for using our service</p>
          </div>
      </div>
  </body>
  </html>`;
};
