import dynamic from 'next/dynamic'

const SignUp = dynamic(() => import('../src/pages/SignUp'), {
  loading: () => <div>Loading...</div>
})

export default function SignUpPage() {
  return <SignUp />
}
