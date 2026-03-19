import { prisma } from "@/lib/db"

const Page =async ()=>{

 const user = await prisma.user.findMany()
  return <div>{JSON.stringify(user,null,2)}</div>
}

export default Page