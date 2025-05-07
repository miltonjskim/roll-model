package com.ccc.roll_model.global.config;

import com.fasterxml.jackson.databind.ser.std.StringSerializer;
import org.apache.kafka.clients.admin.NewTopic;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * Kafka 관련 설정을 담당하는 인프라 계층의 설정 클래스
 */

@Configuration
public class KafkaProducerConfig {

    @Value("${spring.kafka.bootstrap-servers}")
    private String kafkaHost;

    @Value("${spring.kafka.topic.processing-data.name}")
    private String processingDataTopic;

    @Value("${spring.kafka.topic.processing-data.partitions: 1}")
    private int topicPartitions;

    @Value("${spring.kafka.topic.processing-data.replicas}")
    private short topicReplicas;

    // Producer 설정
    @Bean
    public Map<String, Object> producerConfigs() {
        Map<String, Object> props = new HashMap<>();

        // kafka 서버 주소
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaHost);
        // 메시지 Key를 직렬화할 클래스
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        // 메시지 Value 직렬화
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);

        //ACK_Confing -> 0,1,all -> all : 모든 팔로워가 메시지 받았을 때만 성공
        props.put(ProducerConfig.ACKS_CONFIG, "all");
        // 실패 시 재시도 횟수
        props.put(ProducerConfig.RETRIES_CONFIG, 3);
        // 메시지 묶어서 보낼 최대 크기(byte)
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, 16384);
        // 배치를 기다리는 시간(ms)
        props.put(ProducerConfig.LINGER_MS_CONFIG, 1);
        // producer가 가용할 수 있는 최대 버퍼 메모리
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, 33554432);

        return props;
    }


    /**
     *  Kafka Producer 인스턴스를 만들어주는 팩토리
     *  producerConfigs()를 바탕으로 생성
     */

    @Bean
    public ProducerFactory<String, String> producerFactory() {
        return new DefaultKafkaProducerFactory<>(producerConfigs());
    }

    /**
     * KafkaTemplate 생성
     */
    @Bean
    public KafkaTemplate<String, String> kafkaTemplate() {
        return new KafkaTemplate<>(producerFactory());
    }

    /**
     * Kafka 토픽 생성 설정
     */
    @Bean
    public NewTopic processingDataTopic() {
        return new NewTopic(processingDataTopic, topicPartitions, topicReplicas);
    }

}
