import React, { useEffect, useState } from 'react';
import './App.css';

function App() {

  const [isConnected, setIsConnected] = useState(false);
  const [email, setEmail] = useState(null);
  const [userId, setUserId] = useState('123'); // Default userID
  const [senderEmail, setSenderEmail] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {    
    if(userId) {
      getGoogleOauth(userId);
    }
  }, [userId]);

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
        console.log(result);
        setIsConnected(result.result.isConnected);
        setEmail(result.result.userEmail);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const disconnect = async () => {
    try {
      const response = await fetch(`https://email-google.onrender.com/disconnect?email=${email}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const result = await response.json();
      if (result.success) {
        setIsConnected(false);
        setEmail(null);
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
      console.log(result);
      if(result.success){
        console.log(result.url);
        window.open(result.url, '_self');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const sendMail = async (e) => {
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
      <div>
        <button onClick={() => setUserId('123')}>Connect User 123</button>
        <button onClick={() => setUserId('456')}>Connect User 456</button>
        <button onClick={() => setUserId('789')}>Connect User 789</button>
      </div>

      <button onClick={isConnected ? disconnect : () => connect(userId)}>
        {isConnected ? 'Disconnect' : 'Connect'}
      </button>
      <p>{isConnected ? `You are connected to ${email}` : 'You are disconnected'}</p>

      {isConnected && (
        <form onSubmit={sendMail}>
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
    </>
  );
}

export default App;
