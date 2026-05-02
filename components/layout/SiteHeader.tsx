"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, Fingerprint, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68c454689023af7be794a4cf/05bd4e20e_giftofparenthood_logo_24WHT.png";

export function SiteHeader() {
  const [showMore, setShowMore] = useState(false);
  const [showSubmenu, setShowSubmenu] = useState(false);
  const [showMobile, setShowMobile] = useState(false);

  useEffect(() => {
    document.body.style.overflow = showMobile ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showMobile]);

  const close = () => setShowMobile(false);

  return (
    <header className="bg-orange-500 px-4 md:px-6 h-[68px] flex items-center fixed top-0 left-0 right-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
        <a href="https://giftofparenthood.org" target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_URL} alt="Gift of Parenthood" className="h-6 md:h-8" />
        </a>

        <nav className="hidden md:flex items-center space-x-8 font-sans">
          <a
            href="https://giftofparenthood.org/new-fundraiser/"
            className="text-white hover:text-orange-100 transition-colors font-medium"
          >
            Start a Fundraiser
          </a>
          <a
            href="http://directory.giftofparenthood.org/"
            className="text-white hover:text-orange-100 transition-colors font-medium"
          >
            Find Providers
          </a>
          <a
            href="https://grant.giftofparenthood.org"
            className="text-white hover:text-orange-100 transition-colors font-medium"
          >
            Grant Program
          </a>

          <div className="relative">
            <button
              onClick={() => setShowMore((v) => !v)}
              className="flex items-center text-white hover:text-orange-100 transition-colors font-medium"
            >
              More
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>

            {showMore && (
              <div
                className="absolute top-full right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-2 z-50 text-slate-700"
                onMouseLeave={() => {
                  setShowMore(false);
                  setShowSubmenu(false);
                }}
              >
                <a
                  href="https://giftofparenthood.org/browse-featured-fundraisers/"
                  className="block px-4 py-2 hover:bg-slate-100"
                >
                  Fundraisers
                </a>
                <a
                  href="https://giftofparenthood.org/about-us/"
                  className="block px-4 py-2 hover:bg-slate-100"
                >
                  About Gift of Parenthood
                </a>

                <div className="relative">
                  <button
                    onMouseEnter={() => setShowSubmenu(true)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-100"
                  >
                    Get Involved
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {showSubmenu && (
                    <div
                      className="absolute right-full top-0 mr-1 w-56 bg-white rounded-md shadow-lg py-2 border"
                      onMouseLeave={() => setShowSubmenu(false)}
                    >
                      <a
                        href="https://giftofparenthood.org/partnerships/"
                        className="block px-4 py-2 hover:bg-slate-100"
                      >
                        Partnerships
                      </a>
                      <a
                        href="https://giftofparenthood.org/donate"
                        className="block px-4 py-2 hover:bg-slate-100"
                      >
                        Giving to Gift of Parenthood
                      </a>
                    </div>
                  )}
                </div>

                <a
                  href="https://giftofparenthood.org/support/"
                  className="block px-4 py-2 hover:bg-slate-100"
                >
                  Help Center
                </a>
                <a
                  href="https://giftofparenthood.org/contact/"
                  className="block px-4 py-2 hover:bg-slate-100"
                >
                  Contact
                </a>
              </div>
            )}
          </div>
        </nav>

        <div className="flex items-center gap-1 md:gap-2 md:ml-4">
          <Link
            href="/admin/login"
            aria-label="Admin sign-in"
            title="Admin sign-in"
            className="p-2 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Fingerprint className="w-5 h-5" />
          </Link>
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMobile((v) => !v)}
              className="text-white hover:bg-white/20"
            >
              {showMobile ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {showMobile && (
        <div className="md:hidden fixed inset-0 top-[68px] bg-white z-40 overflow-y-auto font-sans">
          <div className="p-6 space-y-4">
            {[
              { href: "https://giftofparenthood.org/new-fundraiser/", label: "Start a Fundraiser" },
              { href: "http://directory.giftofparenthood.org/", label: "Find Providers" },
              { href: "https://grant.giftofparenthood.org", label: "Grant Program" },
              {
                href: "https://giftofparenthood.org/browse-featured-fundraisers/",
                label: "Fundraisers",
              },
              { href: "https://giftofparenthood.org/about-us/", label: "About Gift of Parenthood" },
              { href: "https://giftofparenthood.org/partnerships/", label: "Partnerships" },
              { href: "https://giftofparenthood.org/donate", label: "Giving to Gift of Parenthood" },
              { href: "https://giftofparenthood.org/support/", label: "Help Center" },
              { href: "https://giftofparenthood.org/contact/", label: "Contact" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={close}
                className="block py-3 text-lg font-medium text-slate-700 hover:text-orange-500 border-b border-slate-200"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
