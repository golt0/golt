"use client";

import { getProjects } from "@/app/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


type Project = {
  id: string;
  name: string;
  updated_at?: string;
  image?: string;
};


export default function MyProjects() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    async function loadProjects() {
      try {
        const data = await getProjects();

        setProjects(data ?? []);

      } catch (error) {
        console.error("Failed to load projects", error);
      } finally {
        setLoading(false);
      }
    }

    loadProjects();

  }, []);



  if (loading) {
    return (
      <div className="text-gray-400 p-10">
        Loading projects...
      </div>
    );
  }



  return (
    <div className="w-full min-h-screen bg-[#1b1b1b] rounded-3xl p-8">


      <div className="flex justify-between items-center mb-8">

        <div className="flex items-center gap-2 
          bg-neutral-900 border border-neutral-700 
          rounded-full px-3 py-1">

          <button className="px-4 py-2 text-sm text-gray-300">
            🔍 Search
          </button>

          <button className="px-4 py-2 rounded-full 
             bg-neutral-700 text-white text-sm">
            My projects
          </button>

          <button className="px-4 py-2 text-sm text-gray-400">
            Recently viewed
          </button>

          <button className="px-4 py-2 text-sm text-gray-400">
            Lovable templates
          </button>

        </div>


        <button
          className="text-gray-300 hover:text-white"
        >
          Browse all →
        </button>

      </div>

      <div className="grid grid-cols-3 gap-6">


        {projects.map((project)=>(
          
          <div
            key={project.id}
            onClick={() =>
              router.push(`/project/${project.id}`)
            }
            className="
              cursor-pointer
              group
            "
          >

            <div
              className="
                h-72
                rounded-2xl
                overflow-hidden
                border border-neutral-700
                bg-neutral-900
                group-hover:border-neutral-500
                transition
              "
            >

              {project.image ? (

                <img
                  src={project.image}
                  className="
                    w-full
                    h-full
                    object-cover
                  "
                />

              ) : (

                <div className="
                  h-full
                  flex
                  items-center
                  justify-center
                  text-neutral-700
                  text-5xl
                ">
                  ◕
                </div>

              )}

            </div>
            <div className="flex items-center gap-3 mt-4">
              <div
                className="
                  w-10
                  h-10
                  rounded-full
                  bg-[#68483e]
                  flex
                  items-center
                  justify-center
                  text-white
                "
              >
                K
              </div>



              <div>

                <h3 className="text-white font-medium">
                  {project.name}
                </h3>


                <p className="text-sm text-gray-500">
                  Edited {project.updated_at ?? "recently"}
                </p>


              </div>


            </div>


          </div>

        ))}


      </div>

    </div>
  );
}
