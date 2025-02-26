import {Navbar} from "@/components/navbar";
import {ProfileForm} from "@/components/game/create-game-form";

export default function UserPage() {
    return (
        <>
            <Navbar></Navbar>
            <div className="flex min-h-svh flex-col items-center justify-center bg-muted p-6 md:p-10">
                <ProfileForm></ProfileForm>
            </div>
        </>
    );
}
