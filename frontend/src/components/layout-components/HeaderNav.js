import React from "react";
import { connect } from "react-redux";
import { Layout } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import Logo from './Logo';
import IntlMessage from 'components/util-components/IntlMessage';
import { toggleCollapsedNav, onMobileNavToggle } from 'redux/actions/Theme';

const { Header } = Layout;

export const HeaderNav = props => {
  const { navCollapsed, mobileNav, toggleCollapsedNav, onMobileNavToggle, isMobile, routeInfo } = props;

  const onToggle = () => {
    if (!isMobile) {
      toggleCollapsedNav(!navCollapsed)
    } else {
      onMobileNavToggle(!mobileNav)
    }
  }

  return (
    <Header className="app-header edmanage-header">
      <div className="edmanage-header-inner">
        <div className="edmanage-logo-row">
          <Logo />
        </div>
        <div className="edmanage-divider" />
        <div className="edmanage-breadcrumb-bar">
          <button className="edmanage-sidebar-toggle" type="button" onClick={onToggle} aria-label="Toggle sidebar">
            {navCollapsed || isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
          <span className="edmanage-breadcrumb-home">Trang chủ</span>
          <span className="edmanage-breadcrumb-separator">\</span>
          <span className="edmanage-breadcrumb-current">
            <IntlMessage id={routeInfo?.title || 'home'} />
          </span>
        </div>
      </div>
    </Header>
  )
}

const mapStateToProps = ({ theme }) => {
  const { navCollapsed, mobileNav } = theme;
  return { navCollapsed, mobileNav }
};

export default connect(mapStateToProps, {toggleCollapsedNav, onMobileNavToggle})(HeaderNav);