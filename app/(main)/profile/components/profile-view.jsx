"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  User,
  Mail,
  Briefcase,
  Calendar,
  FileText,
  Sparkles,
  Edit,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { industries } from "@/data/industries";
import { getUserProfile, updateUser } from "@/actions/user";
import useFetch from "@/hooks/use-fetch";

const profileSchema = z.object({
  industry: z.string().min(1, "Industry is required"),
  experience: z.coerce.number().min(0, "Experience must be 0 or greater"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  skills: z.string().min(1, "At least one skill is required"),
});

export default function ProfileView() {
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState(null); // 'professional' or 'skills'
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [skillsInput, setSkillsInput] = useState("");

  const {
    loading: loadingProfile,
    fn: getProfileFn,
    data: profileData,
    error: profileError,
  } = useFetch(getUserProfile);

  const { loading: updatingProfile, fn: updateProfileFn, data: updateResult } =
    useFetch(updateUser);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(profileSchema),
  });

  // Load profile data on mount
  useEffect(() => {
    getProfileFn();
  }, []);

  // Populate form when profile data is loaded
  useEffect(() => {
    if (profileData) {
      const industryValue = profileData.industry || "";
      setSelectedIndustry(industryValue);
      setValue("industry", industryValue);
      setValue("experience", profileData.experience || 0);
      setValue("bio", profileData.bio || "");

      const skillsValue = Array.isArray(profileData.skills)
        ? profileData.skills.join(", ")
        : "";
      setSkillsInput(skillsValue);
      setValue("skills", skillsValue);
    }
  }, [profileData, setValue]);

  const onSubmit = async (data) => {
    try {
      const skillsArray = data.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0);

      const updateData = {
        industry: data.industry,
        experience: parseInt(data.experience),
        bio: data.bio,
        skills: skillsArray,
      };

      console.log("Submitting profile update:", updateData);
      const result = await updateProfileFn(updateData);
      console.log("Update result:", result);
      
      if (result) {
        toast.success("Profile updated successfully!");
        setIsEditing(false);
        setEditingSection(null);
        // Reload profile data to show updated values
        await getProfileFn();
      } else {
        toast.error("Failed to update profile - no result returned");
      }
    } catch (error) {
      console.error("Update error:", error);
      // Error toast is already shown by useFetch hook
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditingSection(null);
    // Reset form to original values
    if (profileData) {
      setValue("industry", profileData.industry || "");
      setSelectedIndustry(profileData.industry || "");
      setValue("experience", profileData.experience || 0);
      setValue("bio", profileData.bio || "");
      const skillsValue = Array.isArray(profileData.skills)
        ? profileData.skills.join(", ")
        : "";
      setSkillsInput(skillsValue);
      setValue("skills", skillsValue);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileData) {
    // Check if it's a database connection error
    const isDatabaseError = profileError?.message?.includes("Database connection") || 
                            profileError?.message?.includes("Can't reach database");
    
    return (
      <div className="text-center py-12 max-w-2xl mx-auto px-4">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Database Connection Error
          </h3>
          <p className="text-muted-foreground mb-4">
            {isDatabaseError 
              ? "Unable to connect to the database. Please ensure your database is running."
              : "Failed to load profile data. Please try again later."}
          </p>
          {isDatabaseError && (
            <div className="text-sm text-muted-foreground space-y-2 mt-4 text-left bg-background/50 p-4 rounded">
              <p className="font-medium">Quick Setup:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>See <code className="bg-muted px-1 rounded">QUICK_FIX_DATABASE.md</code> for setup instructions</li>
                <li>Or use a free cloud database (Neon, Supabase)</li>
                <li>Make sure your <code className="bg-muted px-1 rounded">.env</code> file has the correct <code className="bg-muted px-1 rounded">DATABASE_URL</code></li>
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  const getIndustryDetails = (industryCode) => {
    if (!industryCode) return { name: "Not set", subIndustry: "" };

    const [industryId, subIndustry] = industryCode.split("-");
    const industry = industries.find((ind) => ind.id === industryId);

    return {
      name: industry?.name || industryId,
      subIndustry: subIndustry ? subIndustry.split("-").join(" ") : "",
    };
  };

  const industryDetails = getIndustryDetails(profileData.industry);
  const skillsArray = Array.isArray(profileData.skills)
    ? profileData.skills
    : [];

  return (
    <div className="max-w-7.5xl px-2 lg:px-4 mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold gradient-title">My Profile</h1>
          <p className="text-muted-foreground mt-2">
            View and manage your account information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Name
                </Label>
                <Input
                  value={profileData.name || "Not set"}
                  disabled
                  className="bg-muted w-3/4"
                />
                <p className="text-xs text-muted-foreground">
                  Name cannot be changed here
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  value={profileData.email}
                  disabled
                  className="bg-muted w-3/4"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </div>

            {/* Account Created */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Member Since
              </Label>
              <Input
                value={new Date(profileData.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
                disabled
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Information
                </CardTitle>
                <CardDescription>
                  Your career and industry details
                </CardDescription>
              </div>
              {editingSection !== "professional" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSection("professional")}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 lg:gap-12">
              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry">
                  Industry <span className="text-red-500">*</span>
                </Label>
                {editingSection === "professional" ? (
                  <>
                    <Select
                      value={selectedIndustry}
                      onValueChange={(value) => {
                        setSelectedIndustry(value);
                        setValue("industry", value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) =>
                          industry.subIndustries.map((sub) => {
                            const value = `${industry.id}-${sub
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "")}`;
                            return (
                              <SelectItem key={value} value={value}>
                                {industry.name} - {sub}
                              </SelectItem>
                            );
                          })
                        )}
                      </SelectContent>
                    </Select>
                    {errors.industry && (
                      <p className="text-sm text-red-500">
                        {errors.industry.message}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="p-3 border rounded-md bg-muted/50">
                    <p className="font-medium">{industryDetails.name}</p>
                    {industryDetails.subIndustry && (
                      <p className="text-sm text-muted-foreground capitalize">
                        {industryDetails.subIndustry.replace(/-/g, " ")}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <Label htmlFor="experience">
                  Years of Experience <span className="text-red-500">*</span>
                </Label>
                {editingSection === "professional" ? (
                  <>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      placeholder="Enter years of experience"
                      className="w-[30%]"
                      {...register("experience")}
                    />
                    {errors.experience && (
                      <p className="text-sm text-red-500">
                        {errors.experience.message}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="p-3 border rounded-md bg-muted/50 w-[30%]">
                    <p className="font-medium">
                      {profileData.experience || 0} years
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">
                Professional Bio <span className="text-red-500">*</span>
              </Label>
              {editingSection === "professional" ? (
                <>
                  <Textarea
                    id="bio"
                    rows={4}
                    placeholder="Tell us about your professional background, achievements, and career goals..."
                    {...register("bio")}
                  />
                  {errors.bio && (
                    <p className="text-sm text-red-500">{errors.bio.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Minimum 10 characters
                  </p>
                </>
              ) : (
                <div className="p-3 border rounded-md bg-muted/50">
                  <p className="whitespace-pre-wrap">
                    {profileData.bio || "No bio provided"}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons for Professional Section */}
            {editingSection === "professional" && (
              <div className="flex gap-4 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updatingProfile}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatingProfile}
                  onClick={() => console.log("Save button clicked - Professional section")}
                >
                  {updatingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Skills & Expertise
                </CardTitle>
                <CardDescription>Your professional skills</CardDescription>
              </div>
              {editingSection !== "skills" && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingSection("skills")}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="skills">
                Skills <span className="text-red-500">*</span>
              </Label>
              {editingSection === "skills" ? (
                <>
                  <Input
                    id="skills"
                    placeholder="e.g., JavaScript, React, Node.js, Python"
                    value={skillsInput}
                    onChange={(e) => {
                      setSkillsInput(e.target.value);
                      setValue("skills", e.target.value);
                    }}
                  />
                  {errors.skills && (
                    <p className="text-sm text-red-500">
                      {errors.skills.message}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Enter skills separated by commas
                  </p>
                </>
              ) : (
                <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/50 min-h-[60px]">
                  {skillsArray.length > 0 ? (
                    skillsArray.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No skills added
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons for Skills Section */}
            {editingSection === "skills" && (
              <div className="flex gap-4 justify-end pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updatingProfile}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updatingProfile}
                  onClick={() => console.log("Save button clicked - Skills section")}
                >
                  {updatingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
