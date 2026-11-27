import { useState } from "react";
import Input from "../Components/ui/Input";
import SubmitButton from "../Components/ui/SubmitButton";
export default function Login({ onSubmit, busy, error }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState("");
  return (
    <>
      <div className="flex w-full justify-center px-6 pt-8 -mb-20">
        <a href="/">
          <img
            src="/images/contractorz-logo-horizontal.svg"
            alt="GetContractorz home"
            className="h-auto w-44 sm:w-52"
          />
        </a>
      </div>
      <section className="min-h-screen w-full px-6 py-40 md:px-16 lg:px-32 md:py-24 flex flex-col items-center justify-center">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary mb-3">
            Super Admin Sign In
          </h1>
          <p className="text-gray-600">
            Access your platform workspace with your superuser account.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({ email, password });
          }}
          className="mt-10 w-full md:w-2xl flex justify-center"
        >
          <div className="w-full max-w-none md:max-w-xl bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100">
            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-center text-sm font-medium"
              >
                {error}
              </div>
            )}
            <Input
              id="super-admin-email"
              type="email"
              label="Email"
              value={email}
              onChange={setEmail}
              isRequired
              fieldClass="w-full text-base"
            />
            <Input
              id="super-admin-password"
              type="password"
              label="Password"
              value={password}
              onChange={setPassword}
              isRequired
              fieldClass="w-full text-base"
            />
            <div className="mt-6">
              <SubmitButton
                isLoading={busy}
                btnName="Sign In"
                btnClass="w-full rounded-xl bg-accent text-white font-semibold py-3 hover:shadow-lg hover:shadow-accent/30 cursor-pointer transition"
              />
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
