/**
 * 강사/봉사자 신청 페이지
 * Phase 4.3.1: 강사/봉사자 신청
 */

import { Form, Input, Select, Button, Card, message, Space, Typography, InputNumber } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { InstructorApplicationFormData } from '@/types/interview'
import { submitInstructorApplication } from '@/entities/interview/api/interview-service'
import { showSuccessMessage, handleError } from '@/shared/utils/error-handler'
import { useAuthStore } from '@/features/auth/model/auth-store'

const { TextArea } = Input
const { Option } = Select
const { Title, Text } = Typography

// 신청 폼 스키마
const applicationSchema = z.object({
  name: z.string().min(1, '이름을 입력해주세요'),
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  phone: z.string().min(1, '전화번호를 입력해주세요'),
  region: z.string().min(1, '지역을 선택해주세요'),
  specialty: z.array(z.string()).min(1, '최소 1개 이상의 전문분야를 선택해주세요'),
  participationHistory: z.number().min(0, '참여이력은 0 이상이어야 합니다'),
  experience: z.string().optional(),
  availableTime: z.string().optional(),
  role: z.enum(['INSTRUCTOR', 'VOLUNTEER']),
})

type ApplicationFormData = z.infer<typeof applicationSchema>

// 지역 옵션
const regionOptions = [
  '서울',
  '경기',
  '인천',
  '강원',
  '충북',
  '충남',
  '대전',
  '세종',
  '부산',
  '울산',
  '경남',
  '경북',
  '대구',
  '광주',
  '전남',
  '전북',
  '제주',
]

// 전문분야 옵션
const specialtyOptions = [
  '경제',
  '금융',
  '경영',
  '마케팅',
  'IT/기술',
  '디자인',
  '언어',
  '문화',
  '예술',
  '스포츠',
  '기타',
]

export function InstructorApplicationPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      role: 'INSTRUCTOR',
      specialty: [],
      participationHistory: 0,
    },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: ApplicationFormData) => {
    if (!user?.id) {
      message.error('로그인이 필요합니다.')
      navigate('/login')
      return
    }

    try {
      const formData: InstructorApplicationFormData = {
        ...data,
        experience: data.experience || undefined,
        availableTime: data.availableTime || undefined,
      }
      
      await submitInstructorApplication(formData, user.id)
      showSuccessMessage(
        `${selectedRole === 'INSTRUCTOR' ? '강사' : '봉사자'} 신청이 완료되었습니다. 면접 일정이 확정되면 알려드리겠습니다.`
      )
      navigate('/interviews/my')
    } catch (error) {
      handleError(error)
      message.error(`${selectedRole === 'INSTRUCTOR' ? '강사' : '봉사자'} 신청에 실패했습니다.`)
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3}>강사/봉사자 신청</Title>
            <Text type="secondary">
              JA Korea 프로그램에 참여할 강사 또는 봉사자로 신청해주세요.
            </Text>
          </div>

          <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
            <Form.Item label="신청 유형" required>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Select {...field} size="large" style={{ width: '100%' }}>
                    <Option value="INSTRUCTOR">강사</Option>
                    <Option value="VOLUNTEER">봉사자</Option>
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item
              label="이름"
              required
              validateStatus={errors.name ? 'error' : ''}
              help={errors.name?.message}
            >
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<UserOutlined />}
                    placeholder="이름을 입력해주세요"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="이메일"
              required
              validateStatus={errors.email ? 'error' : ''}
              help={errors.email?.message}
            >
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<MailOutlined />}
                    placeholder="이메일을 입력해주세요"
                    size="large"
                    type="email"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="전화번호"
              required
              validateStatus={errors.phone ? 'error' : ''}
              help={errors.phone?.message}
            >
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    prefix={<PhoneOutlined />}
                    placeholder="전화번호를 입력해주세요"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="지역"
              required
              validateStatus={errors.region ? 'error' : ''}
              help={errors.region?.message}
            >
              <Controller
                name="region"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="지역을 선택해주세요"
                    size="large"
                    style={{ width: '100%' }}
                  >
                    {regionOptions.map(region => (
                      <Option key={region} value={region}>
                        {region}
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item
              label="전문분야"
              required
              validateStatus={errors.specialty ? 'error' : ''}
              help={errors.specialty?.message || '최소 1개 이상 선택해주세요'}
            >
              <Controller
                name="specialty"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    mode="multiple"
                    placeholder="전문분야를 선택해주세요"
                    size="large"
                    style={{ width: '100%' }}
                  >
                    {specialtyOptions.map(specialty => (
                      <Option key={specialty} value={specialty}>
                        {specialty}
                      </Option>
                    ))}
                  </Select>
                )}
              />
            </Form.Item>

            <Form.Item
              label="참여이력"
              required
              validateStatus={errors.participationHistory ? 'error' : ''}
              help={errors.participationHistory?.message || '이전에 참여한 프로그램 개수를 입력해주세요'}
            >
              <Controller
                name="participationHistory"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    {...field}
                    min={0}
                    placeholder="참여이력 개수"
                    size="large"
                    style={{ width: '100%' }}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="이력 (선택사항)"
              validateStatus={errors.experience ? 'error' : ''}
              help={errors.experience?.message}
            >
              <Controller
                name="experience"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    rows={4}
                    placeholder="관련 경력이나 이력을 입력해주세요"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="가능시간 (선택사항)"
              validateStatus={errors.availableTime ? 'error' : ''}
              help={errors.availableTime?.message}
            >
              <Controller
                name="availableTime"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="예: 평일 오후, 주말 오전 등"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={isSubmitting} size="large">
                  신청하기
                </Button>
                <Button onClick={() => navigate(-1)} size="large">
                  취소
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  )
}

