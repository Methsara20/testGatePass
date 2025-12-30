module.exports = ({
  hodName,
  gatePassNo,
  requester,
  destination_address,
  department,
  purpose,
  submittedDate,
  loginLink
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>New Gate Pass Request</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f6f8;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: auto;
      background: #ffffff;
      padding: 20px;
      border-radius: 6px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.08);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #eeeeee;
      padding-bottom: 10px;
    }
    .header h2 {
      margin: 0;
      color: #2c3e50;
    }
    .content {
      margin-top: 20px;
      color: #333333;
      font-size: 14px;
      line-height: 1.6;
    }
    .details {
      background: #f9f9f9;
      padding: 12px;
      border-radius: 4px;
      margin: 15px 0;
    }
    .details p {
      margin: 6px 0;
    }
    .actions {
      text-align: center;
      margin: 25px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 22px;
      text-decoration: none;
      font-weight: bold;
      border-radius: 4px;
      color: #ffffff;
      background-color: #2980b9;
      font-size: 14px;
    }
    .footer {
      border-top: 1px solid #eeeeee;
      margin-top: 25px;
      padding-top: 10px;
      text-align: center;
      font-size: 12px;
      color: #888888;
    }
  </style>
</head>

<body>
  <div class="container">

    <div class="header">
      <h2>New Gate Pass Request Submitted</h2>
    </div>

    <div class="content">
      <p>Dear <b>${hodName}</b>,</p>

      <p>
        A new <b>Gate Pass Request</b> has been submitted and is awaiting your review.
        Please log in to the Gate Pass System to take action.
      </p>

      <div class="details">
        <p><b>Gate Pass No:</b> ${gatePassNo}</p>
        <p><b>Requester Name:</b> ${requester}</p>
        <p><b>Destination Location:</b> ${destination_address}</p>
        <p><b>Destination Department:</b> ${department}</p>
        <p><b>Purpose:</b> ${purpose}</p>
        <p><b>Submitted Date:</b> ${submittedDate}</p>
      </div>

      <div class="actions">
        <a href="${loginLink}" class="btn">Login to Gate Pass System</a>
      </div>
    </div>

    <div class="footer">
      <p>This is an automated email from the Gate Pass Management System.</p>
      <p>Please do not reply to this email.</p>
    </div>

  </div>
</body>
</html>
`;
