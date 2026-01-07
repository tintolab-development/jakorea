/**
 * 전역 검색 컴포넌트
 * Phase 5.2.1: 강사/봉사자 대시보드
 */

import { Input, AutoComplete, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { searchInstructorContent } from '../api/search-service'

const { Search } = Input

interface GlobalSearchProps {
  placeholder?: string
  style?: React.CSSProperties
}

export function GlobalSearch({ placeholder = '프로그램, 일정 검색...', style }: GlobalSearchProps) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [options, setOptions] = useState<Array<{ value: string; label: React.ReactNode }>>([])

  const handleSearch = async (value: string) => {
    if (!value.trim() || !user?.instructorId) {
      setOptions([])
      return
    }

    try {
      const results = await searchInstructorContent(user.instructorId, value)
      const searchOptions = results.map(result => ({
        value: result.link,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{result.title}</span>
            <Tag color={result.type === 'program' ? 'blue' : 'green'} style={{ marginLeft: 8 }}>
              {result.type === 'program' ? '프로그램' : '일정'}
            </Tag>
          </div>
        ),
        result,
      }))
      setOptions(searchOptions)
    } catch (error) {
      console.error('검색 실패:', error)
      setOptions([])
    }
  }

  const handleSelect = (value: string) => {
    navigate(value)
  }

  const handlePressEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value
    if (value.trim() && options.length > 0) {
      // 첫 번째 검색 결과로 이동
      navigate(options[0].value)
    }
  }

  return (
    <AutoComplete
      style={{ width: '100%', ...style }}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
    >
      <Search
        placeholder={placeholder}
        allowClear
        enterButton={<SearchOutlined />}
        onPressEnter={handlePressEnter}
        size="middle"
      />
    </AutoComplete>
  )
}
