-- Add migration script here
CREATE VIEW
task_summary
AS WITH info AS (
    SELECT
        tmp.task_id,
        tmp.sampling_time,
        tmp.comment,
        tmp.row_num
    FROM (
        SELECT
            task_info.task_id,
            task_info.sampling_time,
            task_info.comment,
            row_number() OVER (
                PARTITION BY
                    task_info.task_id
                ORDER BY
                    task_info.id DESC
            ) AS row_num
        FROM
            task_info
        ORDER BY
            task_info.id DESC
    ) AS tmp
    WHERE
        tmp.row_num = 1
)

SELECT
    ts.id,
    ts.done,
    ts.serial,
    ts.well_id,
    ts.depth,
    ts.sample_set,
    info.sampling_time,
    info.comment
FROM (
    SELECT
        t.id,
        t.done,
        t.serial,
        t.well_id,
        t.depth,
        s.sample_set
    FROM
        task AS t
    FULL JOIN (
        SELECT
            sample_set.task_id,
            json_group_array(
                json_object(
                    'id', sample_set.sample_type_id, 'qty', sample_set.qty
                )
            ) AS sample_set
        FROM
            sample_set
        GROUP BY
            sample_set.task_id
    ) AS s
        ON
            t.id = s.task_id
) AS ts
LEFT JOIN info
    ON
        ts.id = info.task_id
ORDER BY
    ts.id DESC;
