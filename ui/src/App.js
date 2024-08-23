import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [user1, setUser1] = useState({ isConnected: false, email: null });
  const [user2, setUser2] = useState({ isConnected: false, email: null });
  const [user3, setUser3] = useState({ isConnected: false, email: null });

  const [senderEmail, setSenderEmail] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load initial connection statuses for each user
    getGoogleOauth('123', setUser1);
    getGoogleOauth('456', setUser2);
    getGoogleOauth('789', setUser3);
  }, []);

  const getGoogleOauth = async (userId, setUserState) => {
    try {
      const response = await fetch(`https://email-google.onrender.com/authSetting?userID=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        setUserState({
          isConnected: result.result.isConnected,
          email: result.result.userEmail,
        });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const disconnect = async (userState, setUserState) => {
    try {
      const response = await fetch(`https://email-google.onrender.com/disconnect?email=${userState.email}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        setUserState({ isConnected: false, email: null });
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connect = async (userId, setUserState) => {
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
      <div style={{ marginBottom: '20px' }}>
        <h3>User 123</h3>
        <button
          onClick={user1.isConnected ? () => disconnect(user1, setUser1) : () => connect('123', setUser1)}
        >
          {user1.isConnected ? 'Disconnect' : 'Connect'}
        </button>
        <p>{user1.isConnected ? `Connected to ${user1.email}` : 'Disconnected'}</p>

        {user1.isConnected && (
          <form onSubmit={(e) => sendMail(e, '123')}>
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

      <div style={{ marginBottom: '20px' }}>
        <h3>User 456</h3>
        <button
          onClick={user2.isConnected ? () => disconnect(user2, setUser2) : () => connect('456', setUser2)}
        >
          {user2.isConnected ? 'Disconnect' : 'Connect'}
        </button>
        <p>{user2.isConnected ? `Connected to ${user2.email}` : 'Disconnected'}</p>

        {user2.isConnected && (
          <form onSubmit={(e) => sendMail(e, '456')}>
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

      <div style={{ marginBottom: '20px' }}>
        <h3>User 789</h3>
        <button
          onClick={user3.isConnected ? () => disconnect(user3, setUser3) : () => connect('789', setUser3)}
        >
          {user3.isConnected ? 'Disconnect' : 'Connect'}
        </button>
        <p>{user3.isConnected ? `Connected to ${user3.email}` : 'Disconnected'}</p>

        {user3.isConnected && (
          <form onSubmit={(e) => sendMail(e, '789')}>
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
    </>
  );
}

export default App;
