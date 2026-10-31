"use client";

import { useState } from "react";
import CandidateSearch from "../admit-card/CandidateSearch";
import DownloadFormButton from "./DownloadFormButton";
import RegistrationForm from "./RegistrationForm";

export default function Page() {
    const [candidate, setCandidate] = useState<any>(null);

    return (
        <div className="min-h-screen p-6 md:px-10 xl:px-16">
            <h1 className="text-2xl font-bold mb-4 md:mb-6 text-center">Registration Form</h1>

            <div className="flex flex-col lg:flex-row gap-6">

                <CandidateSearch onSelect={setCandidate} />

                <div className="flex-1 flex flex-col justify-center items-center gap-6">
                    {candidate && (
                        <>
                            <DownloadFormButton data={candidate} />
                            <RegistrationForm data={candidate} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}