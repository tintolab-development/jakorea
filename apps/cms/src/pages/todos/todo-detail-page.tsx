/**
 * To-do 처리 화면
 * Phase 5.4: 사용자가 반드시 수행해야 할 작업을 명확히 인지
 * 참고 화면: U-03-02 To-do 처리
 */

import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, Space, Typography, Result, Spin, Alert } from 'antd'
import { SingleCTA, GuideMessage, StatusDisplay } from '@/shared/ui'
import { mockTodosMap } from '@/data/mock'
import type { Todo, TodoType } from '@/types/domain'

const { Title, Paragraph } = Typography

// To-do 타입별 기본 설명
const getDefaultDescription = (type: TodoType): string => {
  const descriptions: Record<TodoType, string> = {
    REPORT: '보고서 제출이 필요합니다.',
    COMPLETE: '작업을 완료해 주세요.',
    REVIEW: '검토가 필요합니다.',
    SUBMIT: '제출이 필요합니다.',
    OTHER: '작업을 완료해 주세요.',
  }
  return descriptions[type] || '작업을 완료해 주세요.'
}

// To-do 타입별 완료 후 결과 기본 안내 (expectedResult가 없을 경우)
const getDefaultExpectedResult = (type: TodoType): string => {
  const results: Record<TodoType, string> = {
    REPORT: '제출 후 다음 절차가 자동으로 진행됩니다.',
    COMPLETE: '완료 후 마이페이지 상태가 자동으로 업데이트됩니다.',
    REVIEW: '검토 후 다음 절차가 진행됩니다.',
    SUBMIT: '제출 후 다음 절차가 자동으로 진행됩니다.',
    OTHER: '작업을 완료하시면 마이페이지 상태가 자동으로 업데이트됩니다.',
  }
  return results[type] || '작업을 완료하시면 마이페이지 상태가 자동으로 업데이트됩니다.'
}

export function TodoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [todo, setTodo] = useState<Todo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTodo = () => {
      if (!id) {
        setLoading(false)
        return
      }

      try {
        const found = mockTodosMap.get(id)
        setTodo(found || null)
      } catch (error) {
        console.error('Failed to load todo:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTodo()
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!todo) {
    return (
      <Result
        status="404"
        title="To-do를 찾을 수 없습니다"
        subTitle="요청하신 To-do 정보가 존재하지 않거나 삭제되었습니다."
        extra={
          <SingleCTA
            label="홈으로 이동"
            targetUrl="/"
            type="primary"
          />
        }
      />
    )
  }

  if (todo.completed) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        <Result
          status="success"
          title="작업이 완료되었습니다"
          subTitle="이 To-do는 이미 처리되었습니다."
          extra={
            <SingleCTA
              label="홈으로 이동"
              targetUrl="/"
              type="primary"
            />
          }
        />
      </div>
    )
  }

  // 작업 설명 결정: description이 있으면 사용, 없으면 타입별 기본 설명
  const workDescription = todo.description || getDefaultDescription(todo.type)

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* To-do 요약 영역 (상단, 가장 강조) - Phase 5.4 */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={2} style={{ margin: 0 }}>
              {todo.label}
            </Title>
            {/* 작업 상태를 문장으로 명확히 표시 - 공통 UI 원칙 적용 */}
            <StatusDisplay
              status="pending"
              statusLabels={{
                pending: '반드시 수행해야 할 작업입니다.',
              }}
              statusColors={{
                pending: 'processing',
              }}
            />
          </Space>
        </Card>

        {/* 작업 설명 영역 - Phase 5.4: description이 없어도 기본 설명 표시 */}
        <Card title="작업 설명">
          <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 15, lineHeight: 1.8 }}>
            {workDescription}
          </Paragraph>
        </Card>

        {/* 완료 후 결과 안내 영역 - Phase 5.4: expectedResult가 있으면 표시, 없으면 타입별 기본 안내 */}
        <Card title="완료 후 결과">
          <Alert
            message={todo.expectedResult || getDefaultExpectedResult(todo.type)}
            type="info"
            showIcon
            style={{ margin: 0 }}
          />
        </Card>

        {/* 실행 CTA 영역 (단일) - Phase 5.4: 공통 UI 원칙 (최대 1개만 노출) */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
            <SingleCTA
              label="바로 처리하기"
              targetUrl={todo.targetUrl}
              type="primary"
              block
              size="large"
            />
          </Space>
        </Card>

        {/* 보조 안내 영역 - Phase 5.4 */}
        <Card>
          <GuideMessage
            message="필요한 작업을 완료하시면 마이페이지 상태가 자동으로 업데이트됩니다."
            type="info"
          />
        </Card>
      </Space>
    </div>
  )
}

