'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux"; 
import { AppDispatch } from "@/lib/cart/store"; 
import { setUser } from "@/lib/cart/userSlice"; 
import { GalleryVerticalEnd } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import DatePicker from "@/components/ui/date-picker";
import { format } from 'date-fns';

interface SignupFormProps {
  className?: string;
  setIsLogin: (val: boolean) => void;
  redirect: string; 
}

export function SignupForm({ className, setIsLogin, redirect, ...props }: SignupFormProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>(); 

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const phoneRegex = /^\d{10}$/;
    if (value && !phoneRegex.test(value)) {
      setPhoneError("Phone number must be exactly 10 digits");
    } else {
      setPhoneError("");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dobFormatted = dob ? format(dob, 'yyyy-MM-dd') : null;

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, dob: dobFormatted, email, password, address, phone, whatsapp: null }),
      });

      const data = await res.json();

      if (emailError || phoneError) {
        toast.error("Please fix the errors before submitting");
        setLoading(false);
        return;
      }      

      if (!res.ok) {
        toast.error(data.message || "Signup failed");
      } else {
        localStorage.setItem("customer_id", data.data.customer_id);
        localStorage.setItem("token", data.data.token);

        dispatch(setUser(data.data));

        toast.success("Signup successful!", { position: "top-right" });

        setEmail("");
        setPassword("");
        setName("");
        setPhone("");
        setAddress("");
        setDob(null);

        router.push(redirect || "/");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollArea className="h-[80vh] scroll-area-hide-scrollbar px-3">
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <form onSubmit={handleSignup}>
          <div className="flex flex-col gap-6 mt-10">
            <div className="flex flex-col items-center gap-2">
              <a href="#" className="flex flex-col items-center gap-2 font-medium">
                <div className="flex size-8 items-center justify-center rounded-md">
                  <GalleryVerticalEnd className="size-6" />
                </div>
              </a>
              <h1 className="text-xl font-bold">Welcome to Mateng</h1>
              <div className="text-center text-sm">
                Already have an account?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="underline underline-offset-4 text-blue-500"
                  type="button"
                >
                  Log In
                </button>
              </div>
            </div>

            <Card className="p-8">
              <div className="flex flex-col gap-4">
                <div className="grid gap-3">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="name">Date of Birth</Label>
                  <DatePicker selected={dob} onChange={setDob}/>
                </div>


                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                  />
                  {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="eg: 96******21"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                  />
                  {phoneError && <p className="text-red-500 text-sm">{phoneError}</p>}
                </div>


                <div className="grid gap-3">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Your Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full text-white" disabled={loading}>
                  {loading ? "Signing Up..." : "Sign Up"}
                </Button>
              </div>

              {/* <div className="relative text-center text-sm mt-6">
                <span className="bg-background text-muted-foreground relative z-10 px-2">Or</span>
                <div className="absolute inset-0 top-1/2 border-t border-border"></div>
              </div>

              <div className="grid gap-4 sm:grid-cols-1 mt-6">
                <Button variant="outline" type="button" className="w-full">
                  Continue with Apple
                </Button>
                <Button variant="outline" type="button" className="w-full">
                  Continue with Google
                </Button>
              </div> */}
            </Card>
          </div>
        </form>

        <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
          By clicking continue, you agree to our <a href="/">Terms of Service</a> and <a href="/">Privacy Policy</a>.
        </div>
      </div>
    </ScrollArea>
  );
}
