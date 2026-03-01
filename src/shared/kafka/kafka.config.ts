import { KafkaOptions, Transport } from '@nestjs/microservices';

const brokerList = process.env.KAFKA_BROKERS?.split(',').map((broker) =>
  broker.trim(),
);

export function getKafkaBrokers(): string[] {
  return brokerList && brokerList.length > 0 ? brokerList : ['localhost:9092'];
}

export function getKafkaClientOptions(
  clientId: string,
  groupId: string,
): KafkaOptions['options'] {
  return {
    client: {
      clientId,
      brokers: getKafkaBrokers(),
    },
    consumer: {
      groupId,
    },
  };
}

export function getKafkaMicroserviceOptions(
  clientId: string,
  groupId: string,
): KafkaOptions {
  return {
    transport: Transport.KAFKA,
    options: getKafkaClientOptions(clientId, groupId),
  };
}
