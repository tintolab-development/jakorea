/**
 * To-do 처리 화면
 * Phase 5.4: 사용자가 반드시 수행해야 할 작업을 명확히 인지
 * 참고 화면: U-03-02 To-do 처리
 */

import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Card, Space, Typography, Result, Spin } from 'antd'
import { SingleCTA, GuideMessage } from '@/shared/ui'
import { mockTodosMap } from '@/data/mock'
import type { Todo } from '@/types/domain'

const { Title, Paragraph, Text } = Typography

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

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* To-do 요약 영역 (상단, 가장 강조) */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Title level={2} style={{ margin: 0 }}>
              {todo.label}
            </Title>
            <Paragraph style={{ margin: 0, fontSize: 16, color: '#ff4d4f' }}>
              <Text strong>반드시 수행해야 할 작업입니다.</Text>
            </Paragraph>
          </Space>
        </Card>

        {/* 작업 설명 영역 */}
        {todo.description && (
          <Card title="작업 설명">
            <Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {todo.description}
            </Paragraph>
          </Card>
        )}

        {/* 완료 후 결과 안내 영역 */}
        {todo.expectedResult && (
          <Card title="완료 후 결과">
            <Paragraph style={{ margin: 0 }}>
              {todo.expectedResult}
            </Paragraph>
          </Card>
        )}

        {/* 실행 CTA 영역 (단일) */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%', textAlign: 'center' }}>
            <SingleCTA
              label="바로 처리하기"
              targetUrl={todo.targetUrl}
              type="primary"
            />
          </Space>
        </Card>

        {/* 보조 안내 영역 */}
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

