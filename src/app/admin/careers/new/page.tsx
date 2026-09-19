import { assertAdmin } from '../assertAdmin'
import OpeningForm from '../OpeningForm'

export default async function AddOpeningPage() {
  await assertAdmin()
  return <OpeningForm mode="new" />
}
