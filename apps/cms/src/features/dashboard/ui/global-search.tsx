/**
 * 전역 검색 컴포넌트
 * Phase 5.2.1: 강사/봉사자 대시보드
 */

import { Input, AutoComplete, Tag } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { searchInstructorContent, searchAdminContent } from '../api/search-service'

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
    if (!value.trim()) {
      setOptions([])
      return
    }

    try {
      let results
      
      // 관리자인 경우 전체 검색
      if (user?.role === 'ADMIN') {
        results = await searchAdminContent(value)
      } else if (user?.instructorId) {
        // 강사/봉사자인 경우 본인 콘텐츠만 검색
        results = await searchInstructorContent(user.instructorId, value)
      } else {
        setOptions([])
        return
      }

      const getTypeLabel = (type: string) => {
        switch (type) {
          case 'program':
            return '프로그램'
          case 'schedule':
            return '일정'
          case 'user':
            return '회원'
          case 'school':
            return '학교'
          case 'instructor':
            return '강사'
          case 'application':
            return '신청'
          default:
            return type
        }
      }

      const getTypeColor = (type: string) => {
        switch (type) {
          case 'program':
            return 'blue'
          case 'schedule':
            return 'green'
          case 'user':
            return 'purple'
          case 'school':
            return 'cyan'
          case 'instructor':
            return 'orange'
          case 'application':
            return 'geekblue'
          default:
            return 'default'
        }
      }

      const searchOptions = results.map(result => ({
        value: result.link,
        label: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div>{result.title}</div>
              {result.description && (
                <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                  {result.description}
                </div>
              )}
            </div>
            <Tag color={getTypeColor(result.type)} style={{ marginLeft: 8 }}>
              {getTypeLabel(result.type)}
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
