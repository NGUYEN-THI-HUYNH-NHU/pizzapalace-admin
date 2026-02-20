import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Navbar = async () => {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    return (
        <div>

        </div>
    );
}

export default Navbar;