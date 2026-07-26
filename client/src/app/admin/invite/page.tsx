"use client";

import { Suspense } from "react";
import AdminInvitePage from './InvitePass'

export default function ViewBrand() {

  return (
    <div>
      <Suspense fallback={<div>Loading Page</div>}>
        <AdminInvitePage/>
      </Suspense>
    </div>
  );
}