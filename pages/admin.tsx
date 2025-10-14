import dynamic from 'next/dynamic'

const Admin = dynamic(() => import('../src/pages/Admin'), {
  loading: () => <div>Loading...</div>
})

export default function AdminPage() {
  return <Admin />
}

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  }
}
