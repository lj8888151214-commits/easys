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
 * StudyGroup(모임 캘린더)을 재설계하면서 더 이상 쓰이지 않는 옛 컬럼
 * (category, target_date, meeting_time, member_count)이 study_groups
 * 테이블에 NOT NULL 제약과 함께 남아있으면, 새 Entity가 값을 채워주지 않는
 * INSERT("Field 'member_count' doesn't have a default value" 등)가 실패한다.
 *
 * spring.jpa.hibernate.ddl-auto=update는 컬럼을 추가만 할 뿐 삭제/변경하지
 * 않으므로(이 프로젝트에는 Flyway/Liquibase 같은 마이그레이션 도구가 없다),
 * 앱 기동 시 한 번 이 컬럼들이 남아있는지 확인하고 남아있으면 제거한다.
 *
 * study_groups는 이번 재설계 전까지 프론트엔드에서 실제로 호출되지 않던
 * 미사용 기능이었기 때문에(운영 중인 실데이터가 없음) 컬럼 제거로 인한
 * 데이터 손실 위험이 없다. 컬럼이 이미 없으면(=이미 정리된 DB) 아무 것도
 * 하지 않는 멱등 동작이라 여러 번, 여러 환경(팀원 각자의 로컬 DB 포함)에서
 * 반복 실행해도 안전하다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StudyGroupSchemaFixInitializer implements CommandLineRunner {

    private static final String TABLE = "study_groups";

    private static final String[] OBSOLETE_COLUMNS = {
            "member_count", "target_date", "meeting_time", "category"
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
            log.info("[StudyGroup 스키마 정리] {}.{} 컬럼을 제거했습니다 (재설계로 더 이상 사용하지 않음).", TABLE, column);
        }
    }
}
