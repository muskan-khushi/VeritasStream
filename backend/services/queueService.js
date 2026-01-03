const amqp = require('amqplib');

class QueueService {
    constructor() {
        this.connection = null;
        this.channel = null;
        this.queueName = 'forensics_tasks'; // Define the queue name here
    }

    async connect() {
        if (this.connection) return;

        try {
            // Connect to the RabbitMQ Server
            this.connection = await amqp.connect(process.env.RABBIT_URI || 'amqp://guest:guest@localhost:5672');
            this.channel = await this.connection.createChannel();
            
            // Assert the queue exists (Durable = survives restarts)
            await this.channel.assertQueue(this.queueName, { durable: true });
            
            console.log('🐰 Connected to RabbitMQ');
        } catch (error) {
            console.error('RabbitMQ Connection Failed:', error);
            // Retry logic could go here
        }
    }

    async publish(data) {
        try {
            if (!this.channel) {
                await this.connect();
            }

            // 1. Convert Object to JSON String
            const messageBuffer = Buffer.from(JSON.stringify(data));

            // 2. Send to Queue
            this.channel.sendToQueue(this.queueName, messageBuffer, {
                persistent: true // Save to disk
            });

            console.log(`📤 Task sent to ${this.queueName}`);
        } catch (error) {
            console.error('Queue Publish Error:', error);
            throw error; // Re-throw so the upload route knows it failed
        }
    }
}

// Export a singleton instance
module.exports = new QueueService();