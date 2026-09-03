package com.easys.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

/*
 * 스터디 카드 생성 화면을 재설계하면서 Study 엔티티에서 topic/studyDate/
 * startTime/endTime 필드를 완전히 제거했다 (스터디룸 예약은 이제 스터디
 * 카드의 고정 일정이 아니라, 예약 단계에서 직접 날짜/시간을 선택하는
 * 방식으로 분리되었다).
 *
 * spring.jpa.hibernate.ddl-auto=update는 컬럼을 추가만 할 뿐 삭제/변경하지
 * 않으므로(이 프로젝트에는 Flyway/Liquibase 같은 마이그레이션 도구가 없다),
 * 앱 기동 시 한 번 이 컬럼들이 study 테이블에 남아있는지 확인하고 남아있으면
 * 제거한다 (StudyGroupSchemaFixInitializer와 동일한 방식).
 *
 * 컬럼이 이미 없으면(=이미 정리된 DB) 아무 것도 하지 않는 멱등 동작이라
 * 여러 번, 여러 환경(팀원 각자의 로컬 DB 포함)에서 반복 실행해도 안전하다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StudySchemaFixInitializer implements CommandLineRunner {

    private static final String TABLE = "study";

    private static final String[] OBSOLETE_COLUMNS = {
            "topic", "study_date", "start_time", "end_time"
    };

    private final DataSource dataSource;

    @Override
    public void run(String... args) throws Exception {
        try (Connection connection = dataSource.getConnection()) {

            if (!tableExists(connection)) {
                return;
            }

            for (String column : OBSOLETE_COLUMNS) {
                dropColumnIfExists(connection, column);
            }
        }
    }

    private boolean tableExists(Connection connection) throws Exception {
        DatabaseMetaData metaData = connection.getMetaData();

        try (ResultSet rs = metaData.getTables(connection.getCatalog(), null, TABLE, new String[]{"TABLE"})) {
            return rs.next();
        }
    }

    private void dropColumnIfExists(Connection connection, String column) throws Exception {
        DatabaseMetaData metaData = connection.getMetaData();

        try (ResultSet rs = metaData.getColumns(connection.getCatalog(), null, TABLE, column)) {
            if (!rs.next()) {
                // 이미 정리된 컬럼 - 할 일 없음
                return;
            }
        }

        try (Statement statement = connection.createStatement()) {
            statement.execute("ALTER TABLE " + TABLE + " DROP COLUMN " + column);
            log.info("[Study 스키마 정리] {}.{} 컬럼을 제거했습니다 (재설계로 더 이상 사용하지 않음).", TABLE, column);
        }
    }
}
