import { useParams } from 'react-router-dom'

export default function Country() {
  const { code } = useParams()
  return <h1>Country: {code}</h1>
}