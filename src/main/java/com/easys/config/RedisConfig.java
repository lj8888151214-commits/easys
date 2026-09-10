package com.easys.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.StringRedisSerializer;

// AI 챗봇 1단계: Redis 연결 설정.
//
// RedisTemplate은 자바 코드와 Redis 사이를 오가는 다리 역할을 하는 객체다.
// 지금은 "문자열만" 저장/조회할 것이므로 key/value 둘 다 StringRedisSerializer를
// 사용한다(사람이 읽을 수 있는 문자열 그대로 저장). 나중에 대화 목록처럼 더 복잡한
// 데이터를 다루게 되면 이 설정을 바꾸면 된다 - 그때도 이 클래스 하나만 고치면 된다.
//
// application.properties의 spring.data.redis.host/port 값으로 Spring Boot가
// RedisConnectionFactory(실제 Redis 서버와의 연결)를 자동으로 만들어주므로,
// 여기서는 그 연결을 받아서 RedisTemplate에 연결해주기만 하면 된다.
@Configuration
public class RedisConfig {

    @Bean
    public RedisTemplate<String, String> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, String> redisTemplate = new RedisTemplate<>();
        redisTemplate.setConnectionFactory(connectionFactory);
        redisTemplate.setKeySerializer(new StringRedisSerializer());
        redisTemplate.setValueSerializer(new StringRedisSerializer());
        return redisTemplate;
    }
}
