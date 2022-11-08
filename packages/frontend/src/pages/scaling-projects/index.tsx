import React from 'react'

import { Config } from '../../build/config'
import { PagesData } from '../../build/types'
import { PageWrapper } from '../../components'
import { getIncludedProjects } from '../../utils/getIncludedProjects'
import { getProps } from './props'
import { ProjectPage } from './view/ProjectPage'

export function getProjectPages(config: Config, pagesData: PagesData) {
  const included = getIncludedProjects(config.layer2s, pagesData.tvlApiResponse)

  return included.map((project) => {
    const { wrapper, props } = getProps(project, config, pagesData)

    return {
      slug: `/scaling/projects/${project.display.slug}`,
      page: (
        <PageWrapper {...wrapper}>
          <ProjectPage {...props} />
        </PageWrapper>
      ),
    }
  })
}
