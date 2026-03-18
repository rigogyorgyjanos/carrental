// app/admin/cars/[id]/edit/page.tsx

import CarEditForm from "./CarEditForm"

interface Props {
    params: Promise<{ id: string }>
}

export default async function EditCarPage({ params }: Props) {
    const { id } = await params;
    return <CarEditForm carId={id} />
}