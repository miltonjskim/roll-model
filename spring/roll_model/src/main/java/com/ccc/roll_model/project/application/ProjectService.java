package com.ccc.roll_model.project.application;

import com.ccc.roll_model.member.domain.Member;
import com.ccc.roll_model.member.domain.MemberRepository;
import com.ccc.roll_model.member.infrastructure.MemberEntity;
import com.ccc.roll_model.member.infrastructure.MemberMapper;
import com.ccc.roll_model.project.infrastructure.entity.Category;
import com.ccc.roll_model.project.infrastructure.entity.Domain;
import com.ccc.roll_model.project.infrastructure.entity.ProjectEntity;
import com.ccc.roll_model.project.infrastructure.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final MemberRepository memberRepository;
    private final MemberMapper memberMapper;

    public ProjectEntity createProject(CreateProjectCommand command) {

        Member member = memberRepository.findById(command.getMemberId()).orElse(null);
        MemberEntity memberEntity = memberMapper.toEntity(member);

        Category category = null;
        switch(command.getCategory()) {
            case "REGRESSION": category = Category.REGRESSION; break;
            case "CLASSIFICATION": category = Category.CLASSIFICATION; break;
            default: break;
        }
        if(category == null) {
            throw new IllegalArgumentException("카테고리 입력이 잘못되었습니다람쥐");
        }

        Domain domain = null;
        switch(command.getDomain()) {
            case "FINANCE": domain = Domain.FINANCE; break;
            case "HEALTHCARE": domain = Domain.HEALTHCARE; break;
            case "RETAIL": domain = Domain.RETAIL; break;
            case "MARKETING": domain = Domain.MARKETING; break;
            case "MANUFACTURING": domain = Domain.MANUFACTURING; break;
            case "EDUCATION": domain = Domain.EDUCATION; break;
            case "REAL_ESTATE": domain = Domain.REAL_ESTATE; break;
            case "LOGISTICS": domain = Domain.LOGISTICS; break;
            case "ENTERTAINMENT": domain = Domain.ENTERTAINMENT; break;
            case "GENERAL": domain = Domain.GENERAL; break;
            default: break;
        }
        if(domain == null) {
            throw new IllegalArgumentException("도메인 입력이 잘못되었습니다람쥐");
        }

        ProjectEntity projectEntity = ProjectEntity.builder()
                .memberEntity(memberEntity)
                .title(command.getTitle())
                .description(command.getDescription())
                .category(category)
                .domain(domain)
                .publicYn(command.getPublicYn())
                .deletedYn(false)
                .build();
        return projectRepository.save(projectEntity);
    }
}
