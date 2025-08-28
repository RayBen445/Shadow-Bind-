// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  const { method } = req;

  switch (method) {
    case 'GET':
      // Get messages
      res.status(200).json({
        success: true,
        data: [
          {
            id: '1',
            text: 'Welcome to Shadow Bind!',
            sender: 'System',
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            text: 'This is a sample message',
            sender: 'Demo User',
            timestamp: new Date(Date.now() - 300000).toISOString(),
          }
        ]
      });
      break;

    case 'POST':
      // Create new message
      const { text, sender } = req.body;
      
      if (!text || !sender) {
        return res.status(400).json({
          success: false,
          error: 'Text and sender are required'
        });
      }

      // In a real app, this would save to Firebase
      res.status(201).json({
        success: true,
        data: {
          id: Date.now().toString(),
          text,
          sender,
          timestamp: new Date().toISOString(),
        }
      });
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}