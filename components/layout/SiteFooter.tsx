import Link from "next/link";
import { Mail, Facebook, Twitter, Instagram } from "lucide-react";

export function SiteFooter() {
  return (
    <>
      <div className="h-1 bg-amber-500" />
      <footer className="bg-black text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-16">
            <p className="text-gray-300 mb-8 text-lg">Share or connect with us on social media:</p>
            <div className="flex justify-center space-x-4">
              <a
                href="mailto:?subject=Check%20out%20this%20article%20from%20Gift%20of%20Parenthood"
                className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center hover:bg-amber-200 transition-colors"
              >
                <Mail className="w-6 h-6 text-amber-800" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                <Instagram className="w-6 h-6 text-white" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-6 h-6 text-white" />
              </a>
              <a
                href="https://twitter.com/intent/tweet?text=Check%20out%20Gift%20of%20Parenthood&url=https://blog.giftofparenthood.org"
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors"
              >
                <Twitter className="w-6 h-6 text-white" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <h3 className="text-white font-semibold mb-4">Gift of Parenthood Blog</h3>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Evidence-based articles on fertility, adoption, surrogacy, and building the family
                that's right for you.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Navigation</h4>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    Latest Articles
                  </Link>
                </li>
                <li>
                  <a
                    href="https://giftofparenthood.org/new-fundraiser"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Start a Fundraiser
                  </a>
                </li>
                <li>
                  <a
                    href="http://directory.giftofparenthood.org/"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Provider Directory
                  </a>
                </li>
                <li>
                  <a
                    href="https://grant.giftofparenthood.org"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Grant Program
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">More</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://giftofparenthood.org/about-us"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="https://giftofparenthood.org/partnerships"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Partnerships
                  </a>
                </li>
                <li>
                  <Link href="/rss.xml" className="text-gray-400 hover:text-white transition-colors">
                    RSS Feed
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-6">Support</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://giftofparenthood.org/support/"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="https://giftofparenthood.org/contact/"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-16 pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
              <p className="text-gray-400 text-sm max-w-md mb-6 lg:mb-0">
                Supporting families on their journey. Articles on this blog are informational and
                not medical advice — please consult a qualified clinician for your specific
                situation.
              </p>
              <div className="text-gray-500 text-sm">
                Copyright © {new Date().getFullYear()}. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
