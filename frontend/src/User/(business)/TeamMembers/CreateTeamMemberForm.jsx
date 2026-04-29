import { useState } from "react";
import {
  useCreateTeamMemberMutation,
  useCreateUserMutation,
  useCheckUserExistsMutation,
  useFetchBusinessesQuery,
} from "../../../store";
import { CgClose } from "react-icons/cg";
import {
  LuBadgeInfo,
  LuUser,
  LuMail,
  LuPhone,
  LuBriefcase,
  LuBookOpen,
  LuSparkles,
  LuPlus,
} from "react-icons/lu";
import Dropdown from "../../../Components/ui/Dropdown";

function generateStrongPassword(length = 12) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=<>?";
  let password = "";
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}

export default function CreateTeamMemberForm({
  token,
  showModal,
  setShowModal,
  setAlert,
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [jobDuties, setJobDuties] = useState("");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState([]);
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [createUser, { isLoading: isUserLoading }] = useCreateUserMutation();
  const [createTeamMember, { isLoading: isTeamMemberLoading }] =
    useCreateTeamMemberMutation();
  const [checkUserExists, { isLoading: isCheckingUser }] =
    useCheckUserExistsMutation();
  const { data: businesses } = useFetchBusinessesQuery(undefined, {
    skip: !token,
  });

  const isSubmitting = isUserLoading || isTeamMemberLoading || isCheckingUser;

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setRole("EMPLOYEE");
    setJobDuties("");
    setSkillInput("");
    setSkills([]);
    setEmailError("");
    setPhoneError("");
  };

  const validateEmail = (value) => {
    const emailValue = value.trim();
    if (!emailValue) return "Email is required.";

    // Practical email check: user@domain.tld
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailPattern.test(emailValue)) {
      return "Enter a valid email address.";
    }

    return "";
  };

  const validatePhone = (value) => {
    const phoneValue = value.trim();
    if (!phoneValue) return "Phone number is required.";

    // Allow +, spaces, dashes, brackets but require enough digits.
    const digitsOnly = phoneValue.replace(/\D/g, "");
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return "Enter a valid phone number.";
    }

    return "";
  };

  const sanitizePhoneInput = (value) => {
    const hasLeadingPlus = value.startsWith("+");
    const cleaned = value.replace(/[^\d()\-\s]/g, "");
    return hasLeadingPlus ? `+${cleaned}` : cleaned;
  };

  const addSkill = (skillText) => {
    const cleaned = skillText.trim();
    if (!cleaned) return;

    const alreadyExists = skills.some(
      (skill) => skill.toLowerCase() === cleaned.toLowerCase(),
    );
    if (alreadyExists) return;

    setSkills((current) => [...current, cleaned]);
  };

  const removeSkill = (skillToRemove) => {
    setSkills((current) => current.filter((skill) => skill !== skillToRemove));
  };

  const handleSkillKeyDown = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addSkill(skillInput);
    setSkillInput("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !phone) {
      setAlert({ type: "danger", message: "Please fill all required fields." });
      return;
    }

    const nextEmailError = validateEmail(email);
    const nextPhoneError = validatePhone(phone);
    setEmailError(nextEmailError);
    setPhoneError(nextPhoneError);

    if (nextEmailError || nextPhoneError) {
      setAlert({
        type: "danger",
        message: "Please correct email and phone number before continuing.",
      });
      return;
    }

    const composedSkills = [...skills];
    if (skillInput.trim()) {
      const pendingSkill = skillInput.trim();
      const exists = composedSkills.some(
        (skill) => skill.toLowerCase() === pendingSkill.toLowerCase(),
      );
      if (!exists) composedSkills.push(pendingSkill);
    }

    const expertise = composedSkills.join(", ");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPhone = phone.trim();

      const checkResponse = await checkUserExists({ email: normalizedEmail }).unwrap();
      let userId = checkResponse?.id;

      if (!userId) {
        const password = generateStrongPassword();
        const userPayload = {
          name: name.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          password,
          role,
        };
        const newUser = await createUser(userPayload).unwrap();
        userId = newUser.id;
      }

      const businessId = businesses?.[0]?.id;
      if (!businessId)
        throw new Error("No business found for the current user.");

      await createTeamMember({
        business: businessId,
        employee: userId,
        job_duties: jobDuties,
        expertise,
      }).unwrap();

      setAlert({ type: "success", message: "Team member added successfully." });
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error("Create team member error:", err);
      setAlert({
        type: "danger",
        message:
          "Something went wrong while adding the team member. Please try again.",
      });
    }
  };

  return (
    <>
      {showModal && (
        <div className="fixed inset-0 z-40 h-screen" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/55"
            onClick={() => setShowModal(false)}
            aria-label="Close add member modal"
          />

          <div className="absolute right-0 top-0 z-10 h-screen w-full md:w-4/6 lg:w-2/6 overflow-hidden border-l border-gray-200 bg-white shadow-2xl">
            <form onSubmit={handleSubmit} className="flex h-full flex-col">
              <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h5 className="text-3xl font-semibold text-slate-800">
                      Add Team Member
                    </h5>
                    <p className="mt-1 text-sm text-slate-500">
                      Invite a new member to join your team
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  >
                    <CgClose className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                  <LuBadgeInfo className="h-4 w-4" />
                  <span>
                    Login credentials will be auto-generated and sent to the
                    member&apos;s email
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <section>
                  <h6 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                    Personal Information
                  </h6>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="member-full-name"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <LuUser className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="member-full-name"
                          type="text"
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Enter full name"
                          className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="member-email"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <LuMail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="member-email"
                          type="email"
                          value={email}
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            setEmail(nextValue);
                            if (emailError) {
                              setEmailError(validateEmail(nextValue));
                            }
                          }}
                          onBlur={() => setEmailError(validateEmail(email))}
                          placeholder="member@formexa.com"
                          className={`h-11 w-full rounded-xl bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none ${
                            emailError
                              ? "border border-red-300 focus:border-red-400"
                              : "border border-gray-200 focus:border-accent"
                          }`}
                          aria-invalid={Boolean(emailError)}
                          required
                        />
                      </div>
                      {emailError && (
                        <p className="mt-1 text-xs text-red-600">{emailError}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        Invitation will be sent to this email
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="member-phone"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <LuPhone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="member-phone"
                          type="tel"
                          inputMode="tel"
                          value={phone}
                          onChange={(event) => {
                            const nextValue = sanitizePhoneInput(
                              event.target.value,
                            );
                            setPhone(nextValue);
                            if (phoneError) {
                              setPhoneError(validatePhone(nextValue));
                            }
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key.length === 1 &&
                              /[a-z]/i.test(event.key)
                            ) {
                              event.preventDefault();
                            }
                          }}
                          onBlur={() => setPhoneError(validatePhone(phone))}
                          placeholder="+1 (555) 000-0000"
                          className={`h-11 w-full rounded-xl bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none ${
                            phoneError
                              ? "border border-red-300 focus:border-red-400"
                              : "border border-gray-200 focus:border-accent"
                          }`}
                          aria-invalid={Boolean(phoneError)}
                          required
                        />
                      </div>
                      {phoneError && (
                        <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="mt-7">
                  <h6 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                    Role & Responsibilities
                  </h6>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label
                        htmlFor="member-role"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Role <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        id="member-role"
                        value={role}
                        onChange={setRole}
                        leftIcon={LuBriefcase}
                        options={[
                          { label: "Employee", value: "EMPLOYEE" },
                          { label: "Manager", value: "MANAGER" },
                        ]}
                        buttonClassName="rounded-xl"
                        menuClassName="max-h-72 overflow-auto"
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        Determines access permissions and responsibilities
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="member-job-duties"
                        className="mb-1 block text-sm font-medium text-slate-700"
                      >
                        Job Duties
                      </label>
                      <div className="relative">
                        <LuBookOpen className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <textarea
                          id="member-job-duties"
                          rows={4}
                          maxLength={500}
                          value={jobDuties}
                          onChange={(event) => setJobDuties(event.target.value)}
                          placeholder="Describe primary responsibilities and tasks..."
                          className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent focus:outline-none"
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                        <span>Optional but recommended</span>
                        <span>{jobDuties.length}/500</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="mt-7 pb-3">
                  <h6 className="text-xs font-bold uppercase tracking-[0.08em] text-slate-700">
                    Skills & Expertise
                  </h6>

                  <div className="mt-4">
                    <label
                      htmlFor="member-skill"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Areas of Expertise
                    </label>
                    <div className="relative">
                      <LuSparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="member-skill"
                        type="text"
                        value={skillInput}
                        onChange={(event) => setSkillInput(event.target.value)}
                        onKeyDown={handleSkillKeyDown}
                        placeholder="Type a skill and press Enter"
                        className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-accent focus:outline-none"
                      />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Press Enter to add each skill
                    </p>

                    {skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {skills.map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-gray-200"
                            title="Remove skill"
                          >
                            <LuPlus className="h-3 w-3 rotate-45" />
                            {skill}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div className="border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-gray-100"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow hover:bg-accentLight disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Adding..." : "Add Member"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
