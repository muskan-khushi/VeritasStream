const amqp = require('amqplib');

class QueueService {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    if (this.connection) return;
    try {
      this.connection = await amqp.connect(process.env.RABBIT_URI);
      this.channel = await this.connection.createChannel();
      
      // Durable queue ensures tasks aren't lost if RabbitMQ restarts
      await this.channel.assertQueue('log_processing_task', { 
        durable: true,
        arguments: { 'x-max-priority': 10 }
      });
      console.log('🐰 Connected to RabbitMQ');
      
      this.connection.on('close', () => {
        console.warn('RabbitMQ connection closed, reconnecting...');
        this.connection = null;
        setTimeout(() => this.connect(), 5000);
      });
      
    } catch (error) {
      console.error('RabbitMQ Error:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  async publish(queue, message, priority = 5) {
    if (!this.channel) await this.connect();
    
    const buffer = Buffer.from(JSON.stringify(message));
    this.channel.sendToQueue(queue, buffer, { 
      persistent: true,
      priority: priority,
      timestamp: Date.now()
    });
    console.log(`Task published to ${queue}`);
  }
}

module.exports = new QueueService();