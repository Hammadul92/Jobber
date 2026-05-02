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
  LuBriefcase,
  LuPlus,
} from "react-icons/lu";
import Input from "../../../Components/ui/Input";
import Dropdown from "../../../Components/ui/Dropdown";
import Textarea from "../../../Components/ui/Textarea";
import SubmitButton from "../../../Components/ui/SubmitButton";
import PhoneInputField from "../../../Components/ui/PhoneInput";

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
    setEmailError(nextEmailError);

    if (nextEmailError) {
      setAlert({
        type: "danger",
        message: "Please correct email before continuing.",
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
                    <Input
                      id="member-full-name"
                      label="Full Name"
                      value={name}
                      onChange={setName}
                      isRequired
                      placeholder="Enter full name"
                      fieldClass="h-11 text-sm"
                    />

                    <div>
                      <Input
                        id="member-email"
                        type="email"
                        label="Email Address"
                        value={email}
                        onChange={(nextValue) => {
                          setEmail(nextValue);
                          if (emailError) {
                            setEmailError(validateEmail(nextValue));
                          }
                        }}
                        onBlur={() => setEmailError(validateEmail(email))}
                        isRequired
                        placeholder="member@formexa.com"
                        fieldClass={`h-11 text-sm ${emailError ? "border-red-300 focus:border-red-400" : ""}`}
                      />
                      {emailError && (
                        <p className="mt-1 text-xs text-red-600">{emailError}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        Invitation will be sent to this email
                      </p>
                    </div>

                    <PhoneInputField
                      value={phone}
                      setValue={setPhone}
                      optional={false}
                    />
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
                        className="mb-1 block text-sm font-semibold uppercase text-gray-500"
                      >
                        Role <span className="text-accent">*</span>
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
                        buttonClassName="h-11 text-sm"
                      />
                      <p className="mt-1 text-xs text-slate-400">
                        Determines access permissions and responsibilities
                      </p>
                    </div>

                    <div>
                      <Textarea
                        id="member-job-duties"
                        label="Job Duties"
                        value={jobDuties}
                        onChange={setJobDuties}
                        rows={4}
                        maxLength={500}
                        placeholder="Describe primary responsibilities and tasks..."
                        fieldClass="text-sm"
                      />
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
                    <Input
                      id="member-skill"
                      label="Areas of Expertise"
                      value={skillInput}
                      onChange={setSkillInput}
                      onKeyDown={handleSkillKeyDown}
                      placeholder="Type a skill and press Enter"
                      fieldClass="h-11 text-sm"
                    />
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
                  <SubmitButton
                    isLoading={isSubmitting}
                    btnName="Add Member"
                    btnClass="bg-accent px-4 py-2 text-sm text-white shadow hover:bg-accentLight"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
