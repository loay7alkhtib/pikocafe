import dynamic from 'next/dynamic'

const AdminLogin = dynamic(() => import('../src/pages/AdminLogin'), {
  loading: () => <div>Loading...</div>
})

export default function AdminLoginPage() {
  return <AdminLogin />
}

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  }
}
