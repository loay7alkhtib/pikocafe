import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

const CategoryMenu = dynamic(() => import('../../src/pages/CategoryMenu'), {
  loading: () => <div>Loading...</div>
})

export default function CategoryPage() {
  const router = useRouter()
  const { id } = router.query

  if (!id || typeof id !== 'string') {
    return <div>Loading...</div>
  }

  return <CategoryMenu categoryId={id} />
}

// Disable static generation for this page
export async function getServerSideProps() {
  return {
    props: {},
  }
}
