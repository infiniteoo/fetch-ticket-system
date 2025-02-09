export const generateCloseTicketEmail = (
  selectedTicket,
  closeReason,
  closeSubReason,
  closeMessage,
  surveyLink
) => {
  if (!selectedTicket) return "";

  return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2 style="color: #007bff;">🎟️ Fetch Ticket Update - Ticket Closed</h2>
      <p>Hi <strong>${selectedTicket.name}</strong>,</p>
      <p>Your support ticket has been closed. Below are the details:</p>
      <hr>
      <p><strong>Issue ID:</strong> ${selectedTicket.issue_id}</p>
      <p><strong>Problem Statement:</strong> ${selectedTicket.problem_statement}</p>
      <p><strong>Priority:</strong> ${selectedTicket.priority}</p>
      <p><strong>Status:</strong> Closed</p>
      <p><strong>Tool ID:</strong> ${selectedTicket.tool_id}</p>
      <p><strong>Area:</strong> ${selectedTicket.area}</p>
      <p><strong>Supplier:</strong> ${selectedTicket.supplier}</p>
      <hr>
      <h3>🔒 Closure Details</h3>
      <p><strong>Reason:</strong> ${closeReason}</p>
      <p><strong>Sub-Reason:</strong> ${closeSubReason}</p>
      <p><strong>Additional Notes:</strong> ${closeMessage}</p>
  
      <hr>
      <h3>📢 We'd Love Your Feedback!</h3>
      <p>Help us improve by taking a quick survey about your experience:</p>
      <a href="${surveyLink}" target="_blank">
          <button style="background-color: #28a745; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
          📝 Take the Survey
          </button>
      </a>
      <hr>
      <p>Thank you for using Fetch Ticket System! 🎟️</p>
      </div>
    `;
};

export const generateNewCommentDashboard = (selectedTicket, commentSection) => {
  if (!selectedTicket) return "";

  return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">🎟️ Fetch Ticket Update</h2>
        <p>Hi <strong>${selectedTicket.name}</strong>,</p>
        <p>Your support ticket has received a new comment. Below are the details:</p>
        <hr>
        <p><strong>Issue ID:</strong> ${selectedTicket.issue_id}</p>
        <p><strong>Problem Statement:</strong> ${selectedTicket.problem_statement}</p>
        <p><strong>Priority:</strong> ${selectedTicket.priority}</p>
        <p><strong>Status:</strong> ${selectedTicket.status}</p>
        <p><strong>Tool ID:</strong> ${selectedTicket.tool_id}</p>
        <p><strong>Area:</strong> ${selectedTicket.area}</p>
        <p><strong>Supplier:</strong> ${selectedTicket.supplier}</p>
        <h3>📝 New Comments</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#0073e6;color:white;">
              <th style="padding:10px;border:1px solid #ddd;">Commenter</th>
              <th style="padding:10px;border:1px solid #ddd;">Message</th>
              <th style="padding:10px;border:1px solid #ddd;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${commentSection}
          </tbody>
        </table>
        <hr>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-ticket?issue_id=${selectedTicket.issue_id}" target="_blank" rel="noopener noreferrer">
        <button style="background-color: #007bff; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
          🔍 Open My Ticket
        </button>
      </a>
      <hr>
        <p>Thank you for using Fetch Ticket System! 🎟️</p>
      </div>
    `;
};

export const generateUpdateTicketDashboard = (
  selectedTicket,
  commentSection
) => {
  if (!selectedTicket) return "";

  return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">🎟️ Fetch Ticket Update</h2>
        <p>Hi <strong>${selectedTicket.name}</strong>,</p>
        <p>Your support ticket has received a new update. Below are the details:</p>
        <hr>
        <p><strong>Issue ID:</strong> ${selectedTicket.issue_id}</p>
        <p><strong>Problem Statement:</strong> ${selectedTicket.problem_statement}</p>
        <p><strong>Priority:</strong> ${selectedTicket.priority}</p>
        <p><strong>Status:</strong> ${selectedTicket.status}</p>
        <p><strong>Tool ID:</strong> ${selectedTicket.tool_id}</p>
        <p><strong>Area:</strong> ${selectedTicket.area}</p>
        <p><strong>Supplier:</strong> ${selectedTicket.supplier}</p>
        <h3>📝 New Comments</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#0073e6;color:white;">
              <th style="padding:10px;border:1px solid #ddd;">Commenter</th>
              <th style="padding:10px;border:1px solid #ddd;">Message</th>
              <th style="padding:10px;border:1px solid #ddd;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${commentSection}
          </tbody>
        </table>
        <hr>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-ticket?issue_id=${selectedTicket.issue_id}" target="_blank" rel="noopener noreferrer">
        <button style="background-color: #007bff; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
          🔍 Open My Ticket
        </button>
      </a>
      <hr>
        <p>Thank you for using Fetch Ticket System! 🎟️</p>
      </div>
    `;
};

export const generateUpdateTicketCustomer = (form, commentText) => {
  if (!form) return "";

  return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">🎟️ Fetch Ticket Update</h2>
        <p>Hi <strong>${form.name}</strong>,</p>
        <p>Your support ticket has been updated. Below are the details:</p>
        <hr>
        <p><strong>Issue ID:</strong> ${form.issue_id}</p>
        <p><strong>Problem Statement:</strong> ${form.problem_statement}</p>
        <p><strong>Priority:</strong> ${form.priority}</p>
        <p><strong>Status:</strong> ${form.status}</p>
        <p><strong>Tool ID:</strong> ${form.tool_id}</p>
        <p><strong>Area:</strong> ${form.area}</p>
        <p><strong>Supplier:</strong> ${form.supplier}</p>
        <h3>📝 Changes Made</h3>
        <p>${commentText}</p>
        <hr>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-ticket?issue_id=${form.issue_id}" target="_blank" rel="noopener noreferrer">
        <button style="background-color: #007bff; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
          🔍 Open My Ticket
        </button>
      </a>
      <hr>
        <p>Thank you for using Fetch Ticket System! 🎟️</p>
      </div>
    `;
};

export const generateNewCommentCustomer = (form, commentSection) => {
  if (!form) return "";

  return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">🎟️ Fetch Ticket Update</h2>
        <p>Hi <strong>${form.name}</strong>,</p>
        <p>Your support ticket has received a new comment. Below are the details:</p>
        <hr>
        <p><strong>Issue ID:</strong> ${form.issue_id}</p>
        <p><strong>Problem Statement:</strong> ${form.problem_statement}</p>
        <p><strong>Priority:</strong> ${form.priority}</p>
        <p><strong>Status:</strong> ${form.status}</p>
        <p><strong>Tool ID:</strong> ${form.tool_id}</p>
        <p><strong>Area:</strong> ${form.area}</p>
        <p><strong>Supplier:</strong> ${form.supplier}</p>
        <h3>📝 New Comments</h3>
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#0073e6;color:white;">
              <th style="padding:10px;border:1px solid #ddd;">Commenter</th>
              <th style="padding:10px;border:1px solid #ddd;">Message</th>
              <th style="padding:10px;border:1px solid #ddd;">Date</th>
            </tr>
          </thead>
          <tbody>
            ${commentSection}
          </tbody>
        </table>
        <hr>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-ticket?issue_id=${form.issue_id}" target="_blank" rel="noopener noreferrer">
        <button style="background-color: #007bff; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
          🔍 Open My Ticket
        </button>
      </a>
      <hr>
        <p>Thank you for using Fetch Ticket System! 🎟️</p>
      </div>
    `;
};

export const generateNewTicket = (form, commentSection, newTicketId) => {
  if (!form) return "";

  return `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">🎟️ Fetch Ticket Confirmation</h2>
        <p>Hi <strong>${form.name}</strong>,</p>
        <p>Your support ticket has been submitted successfully. Below are the details:</p>
        <hr>
        <p><strong>Issue ID:</strong> ${newTicketId}</p>
        <p><strong>Problem Statement:</strong> ${form.problem_statement}</p>
        <p><strong>Priority:</strong> ${form.priority}</p>
        <p><strong>Status:</strong> ${form.status}</p>
        <p><strong>Tool ID:</strong> ${form.tool_id}</p>
        <p><strong>Area:</strong> ${form.area}</p>
        <p><strong>Supplier:</strong> ${form.supplier}</p>
         <h3>Comments</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#0073e6;color:white;">
                <th style="padding:10px;border:1px solid #ddd;">Commenter</th>
                <th style="padding:10px;border:1px solid #ddd;">Message</th>
                <th style="padding:10px;border:1px solid #ddd;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${commentSection}
            </tbody>
          </table>
        <hr>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-ticket?issue_id=${newTicketId}" target="_blank" rel="noopener noreferrer">
        <button style="background-color: #007bff; color: white; padding: 10px 20px;
                      border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
          🔍 Open My Ticket
        </button>
      </a>
        <p>Thank you for using Fetch Ticket System! 🎟️</p>
      </div>
    `;
};
