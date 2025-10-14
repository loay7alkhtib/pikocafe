import dynamic from 'next/dynamic'

const Login = dynamic(() => import('../src/pages/Login'), {
  loading: () => <div>Loading...</div>
})

export default function LoginPage() {
  return <Login />
}
