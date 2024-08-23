import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [connections, setConnections] = useState({}); // Store connection status for multiple users
  const [senderEmail, setSenderEmail] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load initial connection statuses for multiple users
    ['123', '456', '789'].forEach((userId) => getGoogleOauth(userId));
  }, []);

  const getGoogleOauth = async (userId) => {
    try {
      const response = await fetch(`https://email-google.onrender.com/authSetting?userID=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        setConnections((prev) => ({
          ...prev,
          [userId]: { isConnected: result.result.isConnected, email: result.result.userEmail },
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const disconnect = async (userId) => {
    try {
      const response = await fetch(`https://email-google.onrender.com/disconnect?email=${connections[userId]?.email}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        setConnections((prev) => ({
          ...prev,
          [userId]: { isConnected: false, email: null },
        }));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connect = async (userId) => {
    try {
      const response = await fetch(`https://email-google.onrender.com/auth?userID=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        window.open(result.url, '_self');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendMail = async (e, userId) => {
    e.preventDefault();
    try {
      const response = await fetch(`https://email-google.onrender.com/sendMail?userID=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderMail: senderEmail,
          receiverMail: receiverEmail,
          subject: subject,
          text: message,
        }),
      });
      const result = await response.json();
      if (result.success) {
        alert('Email sent successfully');
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {['123', '456', '789'].map((userId) => (
        <div key={userId} style={{ marginBottom: '20px' }}>
          <h3>User {userId}</h3>
          <button onClick={connections[userId]?.isConnected ? () => disconnect(userId) : () => connect(userId)}>
            {connections[userId]?.isConnected ? 'Disconnect' : 'Connect'}
          </button>
          <p>{connections[userId]?.isConnected ? `Connected to ${connections[userId]?.email}` : 'Disconnected'}</p>

          {connections[userId]?.isConnected && (
            <form onSubmit={(e) => sendMail(e, userId)}>
              <label>Sender Email</label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
              />
              <label>Receiver Email</label>
              <input
                type="email"
                value={receiverEmail}
                onChange={(e) => setReceiverEmail(e.target.value)}
              />
              <label>Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <label>Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button type="submit">Send</button>
            </form>
          )}
        </div>
      ))}
    </>
  );
}

export default App;
