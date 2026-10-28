import Head from "next/head";
import Globe from "./Globe";
import s from "./page.module.scss";
import cn from "classnames";

export const metadata = {
  title: "Globe Page",
  description: "Interactive 3D Globe View",
};

export default function GlobePage() {
  return (
    <>
      <Head>
        <title>
          Sviluppo Blockchain, Smart contract e solidity - Next Generation
          Developers
        </title>
      </Head>

      <section className={cn("relative ", s.firstSection)}>
        <div className={s.sectionMask}>
          <div className={s.sectionBackgroundMask}>
            <div className={s.sectionBackground}>
              <Globe />
              <div className={s.guides} aria-hidden="true">
                <div className={cn("container", s.guideContainer)}>
                  <div className={s.guide}></div>
                  <div className={s.guide}></div>
                  <div className={s.guide}></div>
                  <div className={s.guide}></div>
                  <div className={s.guide}></div>
                </div>
              </div>
            </div>
          </div>
          <div className={cn("container mx-auto h-full", s.contentContainer)}>
            <div className={cn(s.content)}>
              <div className={cn(s.firstRow)}>
                <div className={cn("col-span-2", s.pointerAuto)}>
                  <span className="block text-white font-bold text-base mb-3">
                    Advance WeblGl globe render.
                  </span>
                  <h1 className="text-white text-xl font-bold mb-5">
                    Not for front-end dev :)
                  </h1>
                  <h2 className="text-white text-lg font-semibold">
                    Advanced frontend web coding for real globe simulation
                  </h2>
                </div>
              </div>
              <div className={cn(s.secondRow)}>
                <div className="">
                  <h3 className="text-white font-bold text-lg mb-4">
                    Future
                  </h3>
                  <p className="text-white font-regular text-base">
                    Our Blockchain <strong>consulting services</strong> help
                    shape your idea into a viable product, leveraging the
                    expertise of leaders in distributed ledger technologies.
                  </p>
                </div>
                <div className="">
                  <h3 className="text-secondary font-bold text-lg mb-4">
                    Globe use
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
