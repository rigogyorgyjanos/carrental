// app/admin/users/[id]/edit/page.tsx

import UserEditForm from "./UserEditForm"


interface Props {
    params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: Props) {
    const { id } = await params;
    return <UserEditForm userId={id} />

}