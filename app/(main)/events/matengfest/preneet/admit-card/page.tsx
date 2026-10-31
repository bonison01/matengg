"use client";

import { useState } from "react";
import CandidateSearch from "./CandidateSearch";
import NEETAdmitCard from "./NEETAdmitCard";
import DownloadAdmitCardButton from "./DownloadAdmitCardButton";

export default function Page() {
    const [candidate, setCandidate] = useState<any>(null);

    return (
        <div className="min-h-screen p-6 md:px-10 xl:px-16">
            <h1 className="text-2xl font-bold mb-4 md:mb-6 text-center">Admit Card Portal</h1>

            <div className="flex flex-col lg:flex-row gap-6">

                <CandidateSearch onSelect={setCandidate} />

                <div className="flex-1 flex flex-col justify-center items-center">
                    {candidate && (
                        <>
                            <DownloadAdmitCardButton data={candidate} />
                            <NEETAdmitCard data={candidate} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}