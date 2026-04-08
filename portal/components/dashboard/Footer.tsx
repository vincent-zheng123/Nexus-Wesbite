"use client";
import React from "react";
import { Mail, MapPin, Twitter, Linkedin, Github, Globe } from "lucide-react";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";

function Footer() {
  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Dashboard", href: "/dashboard" },
        { label: "Call Logs", href: "/calls" },
        { label: "Appointments", href: "/appointments" },
        { label: "Reports", href: "/reports" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Contact Us", href: "mailto:contact@callavoma.com" },
        {
          label: "System Status",
          href: "#",
          pulse: true,
        },
      ],
    },
  ];

  const contactInfo = [
    {
      icon: <Mail size={16} className="text-[#a855f7]" />,
      text: "contact@callavoma.com",
      href: "mailto:contact@callavoma.com",
    },
    {
      icon: <Globe size={16} className="text-[#a855f7]" />,
      text: "callavoma.com",
      href: "https://callavoma.com",
    },
    {
      icon: <MapPin size={16} className="text-[#a855f7]" />,
      text: "United States",
    },
  ];

  const socialLinks = [
    { icon: <Twitter size={18} />, label: "Twitter", href: "#" },
    { icon: <Linkedin size={18} />, label: "LinkedIn", href: "#" },
    { icon: <Github size={18} />, label: "GitHub", href: "#" },
  ];

  return (
    <footer className="relative rounded-2xl overflow-hidden mx-6 mb-6 mt-8" style={{ background: "#0d0a1a" }}>
      <div className="max-w-7xl mx-auto px-10 pt-10 pb-6 z-40 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-8 lg:gap-12 pb-10">
          {/* Brand section */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center space-x-2">
              <span
                className="text-2xl font-black tracking-widest"
                style={{
                  fontFamily: "var(--font-orbitron)",
                  background: "linear-gradient(135deg, #7c3aed, #e879f9)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                AVOMA
              </span>
            </div>
            <p className="text-sm leading-relaxed text-[#6b6b80]">
              AI receptionists for service-based businesses. Never miss a call,
              never lose a booking.
            </p>
          </div>

          {/* Footer link sections */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-[#f3f0ff] text-sm font-semibold mb-5 uppercase tracking-widest">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label} className="relative">
                    <a
                      href={link.href}
                      className="text-sm text-[#6b6b80] hover:text-[#a855f7] transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                    {link.pulse && (
                      <span className="absolute top-1 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact section */}
          <div>
            <h4 className="text-[#f3f0ff] text-sm font-semibold mb-5 uppercase tracking-widest">
              Contact
            </h4>
            <ul className="space-y-3">
              {contactInfo.map((item, i) => (
                <li key={i} className="flex items-center space-x-3">
                  {item.icon}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm text-[#6b6b80] hover:text-[#a855f7] transition-colors duration-200"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-sm text-[#6b6b80]">{item.text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="border-t border-white/5 my-6" />

        {/* Footer bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center text-sm space-y-4 md:space-y-0">
          <div className="flex space-x-5 text-[#6b6b80]">
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="hover:text-[#a855f7] transition-colors duration-200"
              >
                {icon}
              </a>
            ))}
          </div>
          <p className="text-[#6b6b80] text-xs text-center md:text-left">
            &copy; {new Date().getFullYear()} AVOMA. All rights reserved.
          </p>
        </div>
      </div>

      {/* Text hover effect */}
      <div className="lg:flex hidden h-48 -mt-24 -mb-12">
        <TextHoverEffect text="AVOMA" className="z-50" />
      </div>

      <FooterBackgroundGradient />
    </footer>
  );
}

export default Footer;
