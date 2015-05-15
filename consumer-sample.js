#!/usr/bin/env node

var mqConsumer = require('./mq-consumer.js');

mqConsumer.startConsumer({
	mqServerAddress: 'amqp://localhost',
	queueName: 'events',
	messageProcessor: function (message) {
		try {
			return JSON.parse(decodeURIComponent(message));
		} catch (err) {
			return message;
		}
	}
});